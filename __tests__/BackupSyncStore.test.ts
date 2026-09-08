import {
  GoogleDriveBackupError,
  type GoogleDriveBackupService,
} from '../src/services/backup/googleDriveBackupService';
import type { MindsetTrackerBackup } from '../src/services/backup/backupTypes';
import { storage } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/storageKeys';
import { createBackupSyncStore } from '../src/store/useBackupSyncStore';

const backup: MindsetTrackerBackup = {
  backupVersion: 1,
  databaseSchemaVersion: 5,
  exportedAt: '2026-09-06T17:30:00.000Z',
  data: {
    habits: [],
    habitCompletions: [],
    activeJourneys: [],
    journeyTaskCompletions: [],
    preferences: {
      onboarding: { completed: false },
      achievements: { unlocks: [], celebratedPerfectDays: [] },
      weekStartsOn: 0,
    },
  },
};

const remote = {
  id: 'backup-file',
  name: 'mindset_tracker_backup.json',
  modifiedTime: '2026-09-06T17:30:00.000Z',
  md5Checksum: 'checksum-1',
};

function createDependencies(files = false) {
  const drive: GoogleDriveBackupService = {
    listBackupFiles: jest.fn(async () => (files ? [remote] : [])),
    downloadBackup: jest.fn(async () => JSON.stringify(backup)),
    createBackup: jest.fn(async () => remote),
    updateBackup: jest.fn(async () => ({
      ...remote,
      modifiedTime: '2026-09-06T17:31:00.000Z',
      md5Checksum: 'checksum-2',
    })),
    cancelPendingRequests: jest.fn(),
  };
  return {
    drive,
    exportBackup: jest.fn(async () => backup),
    importBackup: jest.fn(async () => undefined),
    hasMeaningfulLocalData: jest.fn(async () => false),
    recoverPendingPreferenceRestore: jest.fn(() => true),
    reloadApplicationData: jest.fn(async () => true),
    now: jest.fn(() => new Date('2026-09-06T17:32:00.000Z')),
  };
}

function resetMetadata() {
  storage.remove(STORAGE_KEYS.BACKUP_LOCAL_REVISION);
  storage.remove(STORAGE_KEYS.BACKUP_ACCOUNT_METADATA);
  storage.remove(STORAGE_KEYS.BACKUP_RESTORE_JOURNAL);
}

describe('backup sync orchestration', () => {
  beforeEach(resetMetadata);
  afterEach(() => {
    jest.useRealTimers();
    resetMetadata();
  });

  test('creates the first backup automatically when local data exists', async () => {
    const dependencies = createDependencies();
    dependencies.hasMeaningfulLocalData.mockResolvedValue(true);
    const store = createBackupSyncStore(dependencies);

    await store.getState().initializeForAccount('google-1');

    expect(dependencies.drive.createBackup).toHaveBeenCalledTimes(1);
    expect(dependencies.drive.updateBackup).not.toHaveBeenCalled();
    expect(store.getState()).toMatchObject({
      status: 'success',
      lastSyncedAt: '2026-09-06T17:32:00.000Z',
    });
  });

  test('requires an explicit direction when local and remote data both exist', async () => {
    const dependencies = createDependencies(true);
    dependencies.hasMeaningfulLocalData.mockResolvedValue(true);
    const store = createBackupSyncStore(dependencies);

    await store.getState().initializeForAccount('google-1');
    expect(store.getState().status).toBe('conflict');
    await expect(store.getState().syncNow()).resolves.toEqual({
      ok: false,
      reason: 'conflict',
    });

    await expect(
      store.getState().syncNow({ confirmRemoteOverwrite: true }),
    ).resolves.toEqual({
      ok: true,
      value: expect.objectContaining({ id: remote.id }),
    });
    expect(dependencies.drive.updateBackup).toHaveBeenCalledTimes(1);
  });

  test('offers and performs restore when local data is empty', async () => {
    const dependencies = createDependencies(true);
    const store = createBackupSyncStore(dependencies);
    await store.getState().initializeForAccount('google-1');

    expect(store.getState().status).toBe('restore_available');
    await expect(store.getState().restoreLatest()).resolves.toEqual({
      ok: true,
      value: undefined,
    });
    expect(dependencies.importBackup).toHaveBeenCalledWith(backup);
    expect(dependencies.reloadApplicationData).toHaveBeenCalledTimes(1);
    expect(dependencies.drive.createBackup).not.toHaveBeenCalled();
  });

  test('re-discovers the newest valid snapshot immediately before restore', async () => {
    const dependencies = createDependencies(true);
    const newerRemote = {
      ...remote,
      id: 'newer-backup-file',
      modifiedTime: '2026-09-06T18:00:00.000Z',
    };
    const newerBackup: MindsetTrackerBackup = {
      ...backup,
      exportedAt: '2026-09-06T18:00:00.000Z',
    };
    const list = jest.mocked(dependencies.drive.listBackupFiles);
    const download = jest.mocked(dependencies.drive.downloadBackup);
    list.mockResolvedValueOnce([remote]).mockResolvedValueOnce([newerRemote]);
    download
      .mockResolvedValueOnce(JSON.stringify(backup))
      .mockResolvedValueOnce(JSON.stringify(newerBackup));
    const store = createBackupSyncStore(dependencies);

    await store.getState().initializeForAccount('google-1');
    await store.getState().restoreLatest();

    expect(dependencies.importBackup).toHaveBeenCalledWith(newerBackup);
  });

  test('does not overwrite a remote-only backup without explicit confirmation', async () => {
    const dependencies = createDependencies(true);
    const store = createBackupSyncStore(dependencies);
    await store.getState().initializeForAccount('google-1');

    await expect(store.getState().syncNow()).resolves.toEqual({
      ok: false,
      reason: 'conflict',
    });
    expect(dependencies.drive.updateBackup).not.toHaveBeenCalled();
  });

  test('debounces local changes and retries pending work after reconnecting', async () => {
    jest.useFakeTimers();
    const dependencies = createDependencies();
    const store = createBackupSyncStore(dependencies);
    await store.getState().initializeForAccount('google-1');

    store.getState().setOnline(false);
    store.getState().markBackupDirty();
    store.getState().markBackupDirty();
    expect(store.getState().status).toBe('offline');
    expect(dependencies.drive.createBackup).not.toHaveBeenCalled();

    store.getState().setOnline(true);
    jest.advanceTimersByTime(2999);
    expect(dependencies.drive.createBackup).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(dependencies.drive.createBackup).toHaveBeenCalledTimes(1);
  });

  test('disconnect cancels pending requests without deleting local state', async () => {
    const dependencies = createDependencies();
    const store = createBackupSyncStore(dependencies);
    await store.getState().initializeForAccount('google-1');

    store.getState().resetForDisconnect();
    expect(dependencies.drive.cancelPendingRequests).toHaveBeenCalledTimes(1);
    expect(store.getState()).toMatchObject({ status: 'idle', userId: undefined });
  });

  test('re-discovers once when an update target disappears', async () => {
    const dependencies = createDependencies();
    const update = jest.mocked(dependencies.drive.updateBackup);
    const list = jest.mocked(dependencies.drive.listBackupFiles);
    update.mockRejectedValueOnce(
      new GoogleDriveBackupError('not_found', 'File was removed.'),
    );
    list
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([remote])
      .mockResolvedValueOnce([]);
    const store = createBackupSyncStore(dependencies);

    await store.getState().initializeForAccount('google-1');
    await store.getState().syncNow({ confirmRemoteOverwrite: true });

    expect(update).toHaveBeenCalledTimes(1);
    expect(dependencies.drive.createBackup).toHaveBeenCalledTimes(1);
  });
});
