import { create } from 'zustand';
import { getSelectedLanguage } from '../localization';
import {
  notificationService,
  createNotificationService,
} from '../services/notificationService';
import { notifyPersistentDataChanged } from '../services/backup/backupSyncEvents';
import { notificationSettingsStorage } from '../storage/notificationSettingsStorage';
import type {
  GlobalReminderSlot,
  NotificationPermissionStatus,
  NotificationPreferences,
  NotificationSyncStatus,
} from '../types/notification';
import { isValidLocalTime } from '../utils/time';
import { useAppStore } from './useAppStore';

export type NotificationState = {
  settings: NotificationPreferences;
  permissionStatus: NotificationPermissionStatus;
  exactAlarmEnabled: boolean;
  scheduledCount: number;
  status: NotificationSyncStatus;
  isInitialized: boolean;
  isSyncing: boolean;
  reminderLimitNoticeVisible: boolean;
  initialize: () => Promise<void>;
  syncNow: (requestPermission?: boolean) => Promise<boolean>;
  scheduleSync: () => void;
  setMasterEnabled: (enabled: boolean) => Promise<boolean>;
  setGlobalRemindersEnabled: (enabled: boolean) => Promise<boolean>;
  setHabitRemindersEnabled: (enabled: boolean) => Promise<boolean>;
  setGlobalReminderTime: (
    slot: GlobalReminderSlot,
    time: string,
  ) => Promise<boolean>;
  openNotificationSettings: () => Promise<void>;
  openAlarmPermissionSettings: () => Promise<void>;
  dismissReminderLimitNotice: () => void;
};

type Dependencies = {
  service: ReturnType<typeof createNotificationService>;
  getHabits: () => ReturnType<typeof useAppStore.getState>['habits'];
};

const defaultDependencies: Dependencies = {
  service: notificationService,
  getHabits: () => useAppStore.getState().habits,
};

export function createNotificationStore(
  dependencyOverrides: Partial<Dependencies> = {},
) {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides };
  let initializePromise: Promise<void> | undefined;
  let syncPromise: Promise<boolean> | undefined;
  let queuedSync = false;
  let syncTimer: ReturnType<typeof setTimeout> | undefined;

  return create<NotificationState>((set, get) => {
    const persistAndSync = async (settings: NotificationPreferences) => {
      if (!notificationSettingsStorage.setSettings(settings)) return false;
      set({ settings });
      notifyPersistentDataChanged();
      await get().syncNow(false);
      return true;
    };

    const performSync = async (requestPermission: boolean) => {
      set({ isSyncing: true, status: 'syncing' });
      try {
        const persistedSettings = notificationSettingsStorage.getSettings();
        set({ settings: persistedSettings });
        let permissionStatus = await dependencies.service.getPermissionStatus();
        if (requestPermission && permissionStatus === 'not_determined') {
          permissionStatus = await dependencies.service.requestPermission();
        }
        const result = await dependencies.service.synchronize(
          persistedSettings,
          dependencies.getHabits(),
          getSelectedLanguage(),
        );
        const permitted =
          result.permissionStatus === 'authorized' ||
          result.permissionStatus === 'provisional';
        set({
          permissionStatus: result.permissionStatus,
          exactAlarmEnabled: result.exactAlarmEnabled,
          scheduledCount: result.scheduledCount,
          isSyncing: false,
          status: permitted ? 'scheduled' : 'permission_required',
        });
        return true;
      } catch (error) {
        if (__DEV__)
          console.error('[notifications] synchronization failed', error);
        set({ isSyncing: false, status: 'error' });
        return false;
      }
    };

    return {
      // Do not persist defaults while the module is imported during onboarding.
      // Initialization runs inside Main, after wake/day-end preferences exist.
      settings: notificationSettingsStorage.buildDefaultSettings(),
      permissionStatus: 'not_determined',
      exactAlarmEnabled: true,
      scheduledCount: 0,
      status: 'idle',
      isInitialized: false,
      isSyncing: false,
      reminderLimitNoticeVisible: false,
      initialize: async () => {
        if (get().isInitialized) return;
        if (initializePromise) return initializePromise;
        initializePromise = (async () => {
          const normalizedCount = await useAppStore
            .getState()
            .normalizeHabitReminderLimit();
          const pendingReminderLimitNotice =
            notificationSettingsStorage.consumeReminderLimitNotice();
          const reminderLimitNoticeVisible =
            normalizedCount > 0 || pendingReminderLimitNotice;
          set({
            settings: notificationSettingsStorage.getSettings(),
            reminderLimitNoticeVisible,
          });
          await get().syncNow(true);
          set({ isInitialized: true });
        })().finally(() => {
          initializePromise = undefined;
        });
        return initializePromise;
      },
      syncNow: async (requestPermission = false) => {
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = undefined;
        if (syncPromise) {
          queuedSync = true;
          return syncPromise;
        }
        syncPromise = performSync(requestPermission).finally(() => {
          syncPromise = undefined;
          if (queuedSync) {
            queuedSync = false;
            get().scheduleSync();
          }
        });
        return syncPromise;
      },
      scheduleSync: () => {
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
          syncTimer = undefined;
          get()
            .syncNow(false)
            .catch(() => undefined);
        }, 150);
      },
      setMasterEnabled: enabled =>
        persistAndSync({ ...get().settings, masterEnabled: enabled }),
      setGlobalRemindersEnabled: enabled =>
        persistAndSync({
          ...get().settings,
          globalRemindersEnabled: enabled,
        }),
      setHabitRemindersEnabled: enabled =>
        persistAndSync({
          ...get().settings,
          habitRemindersEnabled: enabled,
        }),
      setGlobalReminderTime: (slot, time) => {
        if (!isValidLocalTime(time)) return Promise.resolve(false);
        return persistAndSync({
          ...get().settings,
          times: { ...get().settings.times, [slot]: time },
        });
      },
      openNotificationSettings: () =>
        dependencies.service.openNotificationSettings(),
      openAlarmPermissionSettings: () =>
        dependencies.service.openAlarmPermissionSettings(),
      dismissReminderLimitNotice: () =>
        set({ reminderLimitNoticeVisible: false }),
    };
  });
}

export const useNotificationStore = createNotificationStore();
