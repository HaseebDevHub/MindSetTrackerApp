import { useEffect } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { subscribeToPersistentDataChanges } from '../../services/backup/backupSyncEvents';
import { useAppStore } from '../../store/useAppStore';
import { useBackupSyncStore } from '../../store/useBackupSyncStore';
import { useGoogleAuthStore } from '../../store/useGoogleAuthStore';

export function BackupSyncCoordinator() {
  const appHydrated = useAppStore(state => state.isHydrated);
  const authInitialized = useGoogleAuthStore(state => state.isInitialized);
  const googleUserId = useGoogleAuthStore(state => state.user?.id);
  const initializeForAccount = useBackupSyncStore(
    state => state.initializeForAccount,
  );
  const resetForDisconnect = useBackupSyncStore(
    state => state.resetForDisconnect,
  );
  const setOnline = useBackupSyncStore(state => state.setOnline);
  const retryPending = useBackupSyncStore(state => state.retryPending);
  const markBackupDirty = useBackupSyncStore(state => state.markBackupDirty);

  useEffect(
    () => subscribeToPersistentDataChanges(markBackupDirty),
    [markBackupDirty],
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setOnline(
        state.isConnected !== false && state.isInternetReachable !== false,
      );
    });
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') retryPending();
    });
    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [retryPending, setOnline]);

  useEffect(() => {
    if (!appHydrated || !authInitialized) return;
    if (!googleUserId) {
      resetForDisconnect();
      return;
    }
    initializeForAccount(googleUserId).catch(() => undefined);
  }, [
    appHydrated,
    authInitialized,
    googleUserId,
    initializeForAccount,
    resetForDisconnect,
  ]);

  return null;
}
