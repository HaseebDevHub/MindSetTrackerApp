import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from '../../localization';
import { subscribeToPersistentDataChanges } from '../../services/backup/backupSyncEvents';
import { useAppStore } from '../../store/useAppStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { ToastMessage } from './ToastMessage';

export function NotificationCoordinator() {
  const { isRTL, language, t } = useTranslation();
  const habits = useAppStore(state => state.habits);
  const initialize = useNotificationStore(state => state.initialize);
  const isInitialized = useNotificationStore(state => state.isInitialized);
  const scheduleSync = useNotificationStore(state => state.scheduleSync);
  const noticeVisible = useNotificationStore(
    state => state.reminderLimitNoticeVisible,
  );
  const dismissNotice = useNotificationStore(
    state => state.dismissReminderLimitNotice,
  );

  useEffect(() => {
    initialize().catch(() => undefined);
  }, [initialize]);

  useEffect(
    () => subscribeToPersistentDataChanges(scheduleSync),
    [scheduleSync],
  );

  useEffect(() => {
    if (isInitialized) scheduleSync();
  }, [habits, isInitialized, language, scheduleSync]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && isInitialized) scheduleSync();
    });
    return () => subscription.remove();
  }, [isInitialized, scheduleSync]);

  return (
    <ToastMessage
      visible={noticeVisible}
      message={t('notification_limit_normalized')}
      onDismiss={dismissNotice}
      type="info"
      isRTL={isRTL}
    />
  );
}
