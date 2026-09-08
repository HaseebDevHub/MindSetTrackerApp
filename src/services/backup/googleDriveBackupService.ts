import {
  googleAuthService,
  normalizeGoogleAuthError,
  type GoogleAuthService,
} from '../auth/googleAuthService';
import {
  BACKUP_FILE_NAME,
  BACKUP_MIME_TYPE,
  DRIVE_API_BASE_URL,
  DRIVE_REQUEST_TIMEOUT_MS,
  DRIVE_UPLOAD_BASE_URL,
  MAX_BACKUP_BYTES,
} from './backupConstants';
import type { BackupErrorCode, DriveBackupMetadata } from './backupTypes';

export class GoogleDriveBackupError extends Error {
  constructor(public readonly reason: BackupErrorCode, message: string) {
    super(message);
    this.name = 'GoogleDriveBackupError';
  }
}

type DriveDependencies = {
  auth: GoogleAuthService;
  fetchImpl: typeof fetch;
};

const metadataFields = 'id,name,modifiedTime,size,md5Checksum';

function mapHttpError(status: number) {
  if (status === 401) return 'unauthorized' as const;
  if (status === 403) return 'permission_denied' as const;
  if (status === 404) return 'not_found' as const;
  return 'drive_error' as const;
}

function normalizeDriveError(error: unknown): GoogleDriveBackupError {
  if (error instanceof GoogleDriveBackupError) return error;
  const authError = normalizeGoogleAuthError(error);
  if (authError.code === 'network') {
    return new GoogleDriveBackupError('offline', 'Network is unavailable.');
  }
  if (authError.code === 'cancelled') {
    return new GoogleDriveBackupError('cancelled', 'Authorization cancelled.');
  }
  if (authError.code === 'not_signed_in') {
    return new GoogleDriveBackupError('not_connected', 'Not signed in.');
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new GoogleDriveBackupError('offline', 'Drive request timed out.');
  }
  return new GoogleDriveBackupError('drive_error', 'Drive request failed.');
}

function isMetadata(value: unknown): value is DriveBackupMetadata {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<Record<keyof DriveBackupMetadata, unknown>>;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.modifiedTime === 'string' &&
    (record.size === undefined || typeof record.size === 'number') &&
    (record.md5Checksum === undefined || typeof record.md5Checksum === 'string')
  );
}

function parseMetadata(value: unknown): DriveBackupMetadata {
  if (!value || typeof value !== 'object') {
    throw new GoogleDriveBackupError('drive_error', 'Invalid Drive metadata.');
  }
  const source = value as Record<string, unknown>;
  const normalized = {
    ...source,
    size:
      typeof source.size === 'string' ? Number(source.size) : source.size,
  };
  if (!isMetadata(normalized)) {
    throw new GoogleDriveBackupError('drive_error', 'Invalid Drive metadata.');
  }
  return normalized;
}

export function createGoogleDriveBackupService(
  overrides: Partial<DriveDependencies> = {},
) {
  const dependencies: DriveDependencies = {
    auth: overrides.auth ?? googleAuthService,
    fetchImpl: overrides.fetchImpl ?? fetch,
  };
  const activeControllers = new Set<AbortController>();

  async function authorizedRequest(
    url: string,
    init: RequestInit,
    requestScope: boolean,
  ): Promise<Response> {
    let accessToken = await dependencies.auth.getDriveAccessToken(requestScope);
    const perform = async () => {
      const controller = new AbortController();
      activeControllers.add(controller);
      const timeout = setTimeout(
        () => controller.abort(),
        DRIVE_REQUEST_TIMEOUT_MS,
      );
      try {
        return await dependencies.fetchImpl(url, {
          ...init,
          signal: controller.signal,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } finally {
        clearTimeout(timeout);
        activeControllers.delete(controller);
      }
    };

    try {
      let response = await perform();
      if (response.status === 401) {
        accessToken = await dependencies.auth.refreshAccessToken(accessToken);
        response = await perform();
      }
      if (!response.ok) {
        throw new GoogleDriveBackupError(
          mapHttpError(response.status),
          `Drive request failed with status ${response.status}.`,
        );
      }
      return response;
    } catch (error) {
      throw normalizeDriveError(error);
    }
  }

  async function listBackupFiles(requestScope = true) {
    const params = new URLSearchParams({
      spaces: 'appDataFolder',
      q: `name = '${BACKUP_FILE_NAME}' and trashed = false`,
      orderBy: 'modifiedTime desc',
      pageSize: '100',
      fields: `files(${metadataFields})`,
    });
    const response = await authorizedRequest(
      `${DRIVE_API_BASE_URL}/files?${params.toString()}`,
      { method: 'GET' },
      requestScope,
    );
    const parsed: unknown = await response.json();
    if (!parsed || typeof parsed !== 'object') {
      throw new GoogleDriveBackupError('drive_error', 'Invalid Drive response.');
    }
    const files = (parsed as { files?: unknown }).files;
    if (!Array.isArray(files)) return [];
    return files.map(parseMetadata).sort((a, b) =>
      b.modifiedTime.localeCompare(a.modifiedTime),
    );
  }

  async function downloadBackup(file: DriveBackupMetadata, requestScope = true) {
    if (file.size !== undefined && file.size > MAX_BACKUP_BYTES) {
      throw new GoogleDriveBackupError(
        'backup_too_large',
        'Drive backup is too large.',
      );
    }
    const response = await authorizedRequest(
      `${DRIVE_API_BASE_URL}/files/${encodeURIComponent(file.id)}?alt=media`,
      { method: 'GET' },
      requestScope,
    );
    const content = await response.text();
    if (new Blob([content]).size > MAX_BACKUP_BYTES) {
      throw new GoogleDriveBackupError(
        'backup_too_large',
        'Drive backup is too large.',
      );
    }
    return content;
  }

  async function createBackup(content: string) {
    const boundary = `mindset-tracker-${Date.now()}`;
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify({
        name: BACKUP_FILE_NAME,
        mimeType: BACKUP_MIME_TYPE,
        parents: ['appDataFolder'],
      }),
      `--${boundary}`,
      `Content-Type: ${BACKUP_MIME_TYPE}`,
      '',
      content,
      `--${boundary}--`,
      '',
    ].join('\r\n');
    const params = new URLSearchParams({
      uploadType: 'multipart',
      fields: metadataFields,
    });
    const response = await authorizedRequest(
      `${DRIVE_UPLOAD_BASE_URL}/files?${params.toString()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      },
      true,
    );
    return parseMetadata((await response.json()) as unknown);
  }

  async function updateBackup(fileId: string, content: string) {
    const params = new URLSearchParams({
      uploadType: 'media',
      fields: metadataFields,
    });
    const response = await authorizedRequest(
      `${DRIVE_UPLOAD_BASE_URL}/files/${encodeURIComponent(
        fileId,
      )}?${params.toString()}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': BACKUP_MIME_TYPE },
        body: content,
      },
      true,
    );
    return parseMetadata((await response.json()) as unknown);
  }

  function cancelPendingRequests() {
    activeControllers.forEach(controller => controller.abort());
    activeControllers.clear();
  }

  return {
    listBackupFiles,
    downloadBackup,
    createBackup,
    updateBackup,
    cancelPendingRequests,
  };
}

export const googleDriveBackupService = createGoogleDriveBackupService();
export type GoogleDriveBackupService = typeof googleDriveBackupService;
