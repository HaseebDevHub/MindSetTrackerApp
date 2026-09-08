import type { GoogleAuthService } from '../src/services/auth/googleAuthService';
import {
  createGoogleDriveBackupService,
  GoogleDriveBackupError,
} from '../src/services/backup/googleDriveBackupService';

const response = (
  status: number,
  body: unknown,
): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn(async () => body),
    text: jest.fn(async () =>
      typeof body === 'string' ? body : JSON.stringify(body),
    ),
  } as unknown as Response);

function createDependencies() {
  const auth: GoogleAuthService = {
    configure: jest.fn(),
    signIn: jest.fn(async () => ({ status: 'cancelled' as const })),
    signOut: jest.fn(async () => undefined),
    getCurrentUser: jest.fn(() => null),
    restoreSession: jest.fn(async () => null),
    getAccessToken: jest.fn(async () => 'token'),
    getDriveAccessToken: jest.fn(async () => 'token'),
    refreshAccessToken: jest.fn(async () => 'new-token'),
  };
  const fetchImpl = jest.fn<Promise<Response>, [RequestInfo, RequestInit?]>();
  return { auth, fetchImpl };
}

describe('Google Drive backup service', () => {
  test('finds exact appDataFolder files newest first', async () => {
    const dependencies = createDependencies();
    dependencies.fetchImpl.mockResolvedValue(
      response(200, {
        files: [
          {
            id: 'old',
            name: 'mindset_tracker_backup.json',
            modifiedTime: '2026-09-01T00:00:00.000Z',
            size: '40',
          },
          {
            id: 'new',
            name: 'mindset_tracker_backup.json',
            modifiedTime: '2026-09-06T00:00:00.000Z',
            size: '50',
          },
        ],
      }),
    );
    const service = createGoogleDriveBackupService(dependencies);

    await expect(service.listBackupFiles()).resolves.toMatchObject([
      { id: 'new', size: 50 },
      { id: 'old', size: 40 },
    ]);
    const url = String(dependencies.fetchImpl.mock.calls[0][0]);
    expect(decodeURIComponent(url)).toContain('spaces=appDataFolder');
    expect(decodeURIComponent(url).replace(/\+/g, ' ')).toContain(
      "name = 'mindset_tracker_backup.json' and trashed = false",
    );
  });

  test('creates once with appDataFolder metadata and updates by file id', async () => {
    const dependencies = createDependencies();
    dependencies.fetchImpl
      .mockResolvedValueOnce(
        response(200, {
          id: 'created',
          name: 'mindset_tracker_backup.json',
          modifiedTime: '2026-09-06T01:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(
        response(200, {
          id: 'created',
          name: 'mindset_tracker_backup.json',
          modifiedTime: '2026-09-06T02:00:00.000Z',
        }),
      );
    const service = createGoogleDriveBackupService(dependencies);

    await service.createBackup('{"backupVersion":1}');
    await service.updateBackup('created', '{"backupVersion":1}');

    const createCall = dependencies.fetchImpl.mock.calls[0];
    expect(String(createCall[0])).toContain('uploadType=multipart');
    expect(String(createCall[1]?.body)).toContain('"parents":["appDataFolder"]');
    const updateCall = dependencies.fetchImpl.mock.calls[1];
    expect(String(updateCall[0])).toContain('/files/created?');
    expect(updateCall[1]?.method).toBe('PATCH');
  });

  test('refreshes a rejected token exactly once after a 401', async () => {
    const dependencies = createDependencies();
    dependencies.fetchImpl
      .mockResolvedValueOnce(response(401, {}))
      .mockResolvedValueOnce(response(200, { files: [] }));
    const service = createGoogleDriveBackupService(dependencies);

    await expect(service.listBackupFiles()).resolves.toEqual([]);
    expect(dependencies.auth.refreshAccessToken).toHaveBeenCalledWith('token');
    expect(dependencies.fetchImpl).toHaveBeenCalledTimes(2);
  });

  test('rejects an oversized backup before downloading it', async () => {
    const dependencies = createDependencies();
    const service = createGoogleDriveBackupService(dependencies);

    await expect(
      service.downloadBackup({
        id: 'large',
        name: 'mindset_tracker_backup.json',
        modifiedTime: '2026-09-06T00:00:00.000Z',
        size: 11 * 1024 * 1024,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<GoogleDriveBackupError>>({
        reason: 'backup_too_large',
      }),
    );
    expect(dependencies.fetchImpl).not.toHaveBeenCalled();
  });

  test('reports missing app-data permission without retrying', async () => {
    const dependencies = createDependencies();
    dependencies.fetchImpl.mockResolvedValue(response(403, {}));
    const service = createGoogleDriveBackupService(dependencies);

    await expect(service.listBackupFiles()).rejects.toEqual(
      expect.objectContaining<Partial<GoogleDriveBackupError>>({
        reason: 'permission_denied',
      }),
    );
    expect(dependencies.fetchImpl).toHaveBeenCalledTimes(1);
    expect(dependencies.auth.refreshAccessToken).not.toHaveBeenCalled();
  });
});
