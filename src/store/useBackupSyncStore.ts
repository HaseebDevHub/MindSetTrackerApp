import { create } from 'zustand';
import { useAppStore } from './useAppStore';
import { AUTO_SYNC_DEBOUNCE_MS } from '../services/backup/backupConstants';
import {
  GoogleDriveBackupError,
  googleDriveBackupService,
  type GoogleDriveBackupService,
} from '../services/backup/googleDriveBackupService';
import type {
  BackupErrorCode,
  BackupResult,
  DriveBackupMetadata,
  MindsetTrackerBackup,
} from '../services/backup/backupTypes';
import { BackupValidationError, parseBackup } from '../services/backup/backupValidation';
import {
  backupSyncStorage,
  type BackupAccountMetadata,
} from '../storage/backupSyncStorage';

export type SyncStatus =
  | 'idle'
  | 'checking'
  | 'syncing'
  | 'success'
  | 'pending'
  | 'offline'
  | 'restore_available'
  | 'restoring'
  | 'conflict'
  | 'error';

export type BackupSyncState = {
  status: SyncStatus;
  isSyncing: boolean;
  isRestoring: boolean;
  isInitialized: boolean;
  userId?: string;
  lastSyncedAt?: string;
  error?: BackupErrorCode;
  backupMetadata?: DriveBackupMetadata;
  initializeForAccount: (userId: string) => Promise<void>;
  syncNow: (options?: {
    confirmRemoteOverwrite?: boolean;
  }) => Promise<BackupResult<DriveBackupMetadata>>;
  restoreLatest: () => Promise<BackupResult>;
  markBackupDirty: () => void;
  setOnline: (online: boolean) => void;
  retryPending: () => void;
  resetForDisconnect: () => void;
  clearError: () => void;
};

type Dependencies = {
  drive: GoogleDriveBackupService;
  exportBackup: () => Promise<MindsetTrackerBackup>;
  importBackup: (backup: MindsetTrackerBackup) => Promise<void>;
  hasMeaningfulLocalData: () => Promise<boolean>;
  recoverPendingPreferenceRestore: () => boolean | Promise<boolean>;
  reloadApplicationData: () => Promise<boolean>;
  now: () => Date;
};

type Discovery = {
  valid?: { metadata: DriveBackupMetadata; backup: MindsetTrackerBackup };
  newestNamed?: DriveBackupMetadata;
  hadInvalidCandidates: boolean;
};

const defaultDependencies: Dependencies = {
  drive: googleDriveBackupService,
  exportBackup: () =>
    import('../services/backup/backupDataService').then(module =>
      module.exportBackup(),
    ),
  importBackup: backup =>
    import('../services/backup/backupDataService').then(module =>
      module.importBackup(backup),
    ),
  hasMeaningfulLocalData: () =>
    import('../services/backup/backupDataService').then(module =>
      module.hasMeaningfulLocalData(),
    ),
  recoverPendingPreferenceRestore: () =>
    import('../services/backup/backupDataService').then(module =>
      module.recoverPendingPreferenceRestore(),
    ),
  reloadApplicationData: () =>
    useAppStore.getState().reloadPersistentData(),
  now: () => new Date(),
};

function normalizeError(error: unknown): BackupErrorCode {
  if (error instanceof GoogleDriveBackupError) return error.reason;
  if (error instanceof BackupValidationError) return error.reason;
  if (
    error instanceof Error &&
    /restore|database|preference|sync.*metadata/i.test(error.message)
  ) {
    return 'local_write_failed';
  }
  return 'unknown';
}

function remoteMatchesBaseline(
  remote: DriveBackupMetadata,
  account: BackupAccountMetadata | undefined,
) {
  if (!account || account.lastBackupFileId !== remote.id) return false;
  if (account.lastRemoteChecksum && remote.md5Checksum) {
    return account.lastRemoteChecksum === remote.md5Checksum;
  }
  return account.lastRemoteModifiedTime === remote.modifiedTime;
}

export function createBackupSyncStore(
  dependencyOverrides: Partial<Dependencies> = {},
) {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides };
  let initializationPromise: Promise<void> | undefined;
  let syncPromise: Promise<BackupResult<DriveBackupMetadata>> | undefined;
  let restorePromise: Promise<BackupResult> | undefined;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let online = true;
  let queuedAfterCurrent = false;

  const clearDebounce = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = undefined;
  };

  async function discover(requestScope: boolean): Promise<Discovery> {
    const files = await dependencies.drive.listBackupFiles(requestScope);
    let hadInvalidCandidates = false;
    for (const file of files) {
      try {
        const serialized = await dependencies.drive.downloadBackup(
          file,
          requestScope,
        );
        return {
          valid: { metadata: file, backup: parseBackup(serialized) },
          newestNamed: files[0],
          hadInvalidCandidates,
        };
      } catch (error) {
        if (
          error instanceof GoogleDriveBackupError &&
          error.reason === 'not_found'
        ) {
          continue;
        }
        if (
          error instanceof BackupValidationError ||
          (error instanceof GoogleDriveBackupError &&
            error.reason === 'backup_too_large')
        ) {
          hadInvalidCandidates = true;
          continue;
        }
        throw error;
      }
    }
    return { newestNamed: files[0], hadInvalidCandidates };
  }

  return create<BackupSyncState>((set, get) => {
    const schedule = () => {
      clearDebounce();
      if (
        !online ||
        !get().userId ||
        get().isRestoring ||
        get().status === 'conflict'
      )
        return;
      if (get().status === 'restore_available') return;
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        get()
          .syncNow()
          .catch(() => undefined);
      }, AUTO_SYNC_DEBOUNCE_MS);
    };

    const performSync = async (
      confirmRemoteOverwrite = false,
    ): Promise<BackupResult<DriveBackupMetadata>> => {
      const userId = get().userId;
      if (!userId) return { ok: false, reason: 'not_connected' };
      if (!online) {
        set({ status: 'offline', error: 'offline' });
        return { ok: false, reason: 'offline' };
      }
      if (
        (get().status === 'conflict' ||
          get().status === 'restore_available') &&
        !confirmRemoteOverwrite
      ) {
        return { ok: false, reason: 'conflict' };
      }

      set({ status: 'syncing', isSyncing: true, error: undefined });
      try {
        const discovery = await discover(true);
        if (get().userId !== userId) {
          return { ok: false, reason: 'not_connected' };
        }
        const account = backupSyncStorage.getAccount(userId);
        const localRevision = backupSyncStorage.getLocalRevision();
        if (
          discovery.valid &&
          account &&
          !remoteMatchesBaseline(discovery.valid.metadata, account) &&
          localRevision > account.lastSyncedLocalRevision &&
          !confirmRemoteOverwrite
        ) {
          set({
            status: 'conflict',
            error: 'conflict',
            backupMetadata: discovery.valid.metadata,
          });
          return { ok: false, reason: 'conflict' };
        }
        if (
          discovery.hadInvalidCandidates &&
          !discovery.valid &&
          !confirmRemoteOverwrite
        ) {
          set({ status: 'error', error: 'malformed_backup' });
          return { ok: false, reason: 'malformed_backup' };
        }

        const snapshotRevision = backupSyncStorage.getLocalRevision();
        const backup = await dependencies.exportBackup();
        const serialized = JSON.stringify(backup);
        const targetId =
          discovery.valid?.metadata.id ?? discovery.newestNamed?.id;
        let remote: DriveBackupMetadata;
        try {
          remote = targetId
            ? await dependencies.drive.updateBackup(targetId, serialized)
            : await dependencies.drive.createBackup(serialized);
        } catch (error) {
          if (
            !(error instanceof GoogleDriveBackupError) ||
            error.reason !== 'not_found'
          ) {
            throw error;
          }
          // The file can be removed between discovery and upload. Re-discover
          // once so this remains an update when another named backup exists.
          const refreshed = await discover(true);
          const refreshedTargetId =
            refreshed.valid?.metadata.id ?? refreshed.newestNamed?.id;
          remote = refreshedTargetId
            ? await dependencies.drive.updateBackup(
                refreshedTargetId,
                serialized,
              )
            : await dependencies.drive.createBackup(serialized);
        }
        const syncedAt = dependencies.now().toISOString();
        if (
          !backupSyncStorage.recordSuccessfulSync(
            userId,
            remote,
            snapshotRevision,
            syncedAt,
          )
        ) {
          throw new Error('Unable to persist sync metadata.');
        }
        if (get().userId === userId) {
          set({
            status: 'success',
            isSyncing: false,
            error: undefined,
            backupMetadata: remote,
            lastSyncedAt: syncedAt,
          });
        }
        const changedDuringSync =
          backupSyncStorage.getLocalRevision() > snapshotRevision;
        if (changedDuringSync || queuedAfterCurrent) {
          queuedAfterCurrent = false;
          set({ status: 'pending' });
          schedule();
        }
        return { ok: true, value: remote };
      } catch (error) {
        const reason = normalizeError(error);
        if (get().userId === userId) {
          set({
            status: reason === 'offline' ? 'offline' : 'error',
            isSyncing: false,
            error: reason,
          });
        }
        return { ok: false, reason };
      } finally {
        if (get().userId === userId) set({ isSyncing: false });
      }
    };

    return {
      status: 'idle',
      isSyncing: false,
      isRestoring: false,
      isInitialized: false,

      initializeForAccount: userId => {
        if (get().isInitialized && get().userId === userId) {
          return Promise.resolve();
        }
        if (initializationPromise && get().userId === userId) {
          return initializationPromise;
        }
        clearDebounce();
        set({
          userId,
          status: 'checking',
          isInitialized: false,
          error: undefined,
          backupMetadata: undefined,
          lastSyncedAt: backupSyncStorage.getAccount(userId)
            ?.lastSuccessfulSyncAt,
        });
        initializationPromise = (async () => {
          try {
            if (!(await dependencies.recoverPendingPreferenceRestore())) {
              throw new Error('Pending restore preferences could not be applied.');
            }
            const [localExists, discovery] = await Promise.all([
              dependencies.hasMeaningfulLocalData(),
              discover(false),
            ]);
            if (get().userId !== userId) return;
            const account = backupSyncStorage.getAccount(userId);
            const localRevision = backupSyncStorage.getLocalRevision();
            if (discovery.valid && !localExists) {
              set({
                status: 'restore_available',
                backupMetadata: discovery.valid.metadata,
              });
            } else if (discovery.valid && localExists) {
              if (remoteMatchesBaseline(discovery.valid.metadata, account)) {
                if (
                  account &&
                  localRevision > account.lastSyncedLocalRevision
                ) {
                  set({ status: 'pending', backupMetadata: discovery.valid.metadata });
                  schedule();
                } else {
                  set({ status: 'success', backupMetadata: discovery.valid.metadata });
                }
              } else {
                set({
                  status: 'conflict',
                  error: 'conflict',
                  backupMetadata: discovery.valid.metadata,
                });
              }
            } else if (discovery.hadInvalidCandidates) {
              set({ status: 'error', error: 'malformed_backup' });
            } else if (localExists) {
              set({ status: 'pending' });
              const result = await performSync(true);
              if (!result.ok && result.reason === 'offline') {
                set({ status: 'offline' });
              }
            } else {
              set({ status: 'idle' });
            }
          } catch (error) {
            const reason = normalizeError(error);
            if (get().userId === userId) {
              set({
                status: reason === 'offline' ? 'offline' : 'error',
                error: reason,
              });
            }
          } finally {
            if (get().userId === userId) set({ isInitialized: true });
            initializationPromise = undefined;
          }
        })();
        return initializationPromise;
      },

      syncNow: options => {
        if (restorePromise) {
          return Promise.resolve({ ok: false, reason: 'conflict' });
        }
        if (syncPromise) {
          queuedAfterCurrent = true;
          return syncPromise;
        }
        syncPromise = performSync(options?.confirmRemoteOverwrite).finally(() => {
          syncPromise = undefined;
        });
        return syncPromise;
      },

      restoreLatest: () => {
        if (restorePromise) return restorePromise;
        if (syncPromise) {
          return Promise.resolve({ ok: false, reason: 'conflict' });
        }
        const userId = get().userId;
        if (!userId) return Promise.resolve({ ok: false, reason: 'not_connected' });
        clearDebounce();
        restorePromise = (async (): Promise<BackupResult> => {
          set({ status: 'restoring', isRestoring: true, error: undefined });
          try {
            // Always re-discover before a destructive restore so the user gets
            // the newest valid snapshot, not a stale initialization result.
            const discovery = await discover(true);
            if (get().userId !== userId) {
              return { ok: false, reason: 'not_connected' };
            }
            if (!discovery.valid) {
              const reason: BackupErrorCode = discovery.hadInvalidCandidates
                ? 'malformed_backup'
                : 'not_found';
              set({ status: 'error', error: reason });
              return { ok: false, reason };
            }
            await dependencies.importBackup(discovery.valid.backup);
            if (get().userId !== userId) {
              return { ok: false, reason: 'not_connected' };
            }
            const reloaded = await dependencies.reloadApplicationData();
            if (!reloaded) throw new Error('Application data reload failed.');
            const revision = backupSyncStorage.incrementLocalRevision();
            const syncedAt = dependencies.now().toISOString();
            if (
              !backupSyncStorage.recordSuccessfulSync(
                userId,
                discovery.valid.metadata,
                revision,
                syncedAt,
              )
            ) {
              throw new Error('Unable to persist sync metadata.');
            }
            set({
              status: 'success',
              isRestoring: false,
              lastSyncedAt: syncedAt,
              backupMetadata: discovery.valid.metadata,
            });
            return { ok: true, value: undefined };
          } catch (error) {
            const reason = normalizeError(error);
            set({
              status: reason === 'offline' ? 'offline' : 'error',
              isRestoring: false,
              error: reason,
            });
            return { ok: false, reason };
          } finally {
            set({ isRestoring: false });
          }
        })().finally(() => {
          restorePromise = undefined;
        });
        return restorePromise;
      },

      markBackupDirty: () => {
        backupSyncStorage.incrementLocalRevision();
        if (get().isSyncing) queuedAfterCurrent = true;
        if (!get().userId) return;
        if (get().status !== 'conflict' && get().status !== 'restore_available') {
          set({ status: online ? 'pending' : 'offline' });
          if (!get().isSyncing) schedule();
        }
      },

      setOnline: nextOnline => {
        const wasOffline = !online;
        online = nextOnline;
        if (!nextOnline && get().status === 'pending') set({ status: 'offline' });
        if (nextOnline && wasOffline) get().retryPending();
      },

      retryPending: () => {
        if (
          get().userId &&
          (get().status === 'pending' || get().status === 'offline')
        ) {
          set({ status: 'pending', error: undefined });
          schedule();
        }
      },

      resetForDisconnect: () => {
        clearDebounce();
        queuedAfterCurrent = false;
        dependencies.drive.cancelPendingRequests();
        set({
          status: 'idle',
          isSyncing: false,
          isRestoring: false,
          isInitialized: false,
          userId: undefined,
          lastSyncedAt: undefined,
          error: undefined,
          backupMetadata: undefined,
        });
      },

      clearError: () => set({ error: undefined }),
    };
  });
}

export const useBackupSyncStore = createBackupSyncStore();
