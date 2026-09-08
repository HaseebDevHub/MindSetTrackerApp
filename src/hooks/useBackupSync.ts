import { useBackupSyncStore } from '../store/useBackupSyncStore';

export function useBackupSync() {
  const status = useBackupSyncStore(state => state.status);
  const isSyncing = useBackupSyncStore(state => state.isSyncing);
  const isRestoring = useBackupSyncStore(state => state.isRestoring);
  const lastSyncedAt = useBackupSyncStore(state => state.lastSyncedAt);
  const error = useBackupSyncStore(state => state.error);
  const backupMetadata = useBackupSyncStore(state => state.backupMetadata);
  const initializeForAccount = useBackupSyncStore(
    state => state.initializeForAccount,
  );
  const syncNow = useBackupSyncStore(state => state.syncNow);
  const restoreLatest = useBackupSyncStore(state => state.restoreLatest);
  const clearError = useBackupSyncStore(state => state.clearError);
  return {
    status,
    isSyncing,
    isRestoring,
    lastSyncedAt,
    error,
    backupMetadata,
    initializeForAccount,
    syncNow,
    restoreLatest,
    clearError,
  };
}
