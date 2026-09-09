import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidNotificationSetting,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
  type Notification,
  type NotificationSettings,
  type TimestampTrigger,
  type TriggerNotification,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { getSelectedLanguage, t, type AppLanguage } from '../localization';
import type { HabitItem } from '../types/models';
import type {
  GlobalReminderSlot,
  NotificationPermissionStatus,
  NotificationPreferences,
  NotificationSyncResult,
} from '../types/notification';
import {
  GLOBAL_NOTIFICATION_IDS,
  MAX_HABIT_REMINDERS,
  NOTIFICATION_CHANNEL_ID,
  getActiveReminderHabits,
  getHabitNotificationId,
  getNextReminderTimestamp,
  isManagedNotificationId,
} from '../utils/notifications';
import { isValidLocalTime } from '../utils/time';

type DesiredSchedule = {
  id: string;
  time: string;
  title: string;
  body: string;
};

const NOTIFICATION_SMALL_ICON = 'ic_notification';

export type NotificationTransport = {
  createChannel: typeof notifee.createChannel;
  requestPermission: typeof notifee.requestPermission;
  getNotificationSettings: typeof notifee.getNotificationSettings;
  getTriggerNotifications: typeof notifee.getTriggerNotifications;
  createTriggerNotification: typeof notifee.createTriggerNotification;
  cancelTriggerNotification: typeof notifee.cancelTriggerNotification;
  openNotificationSettings: typeof notifee.openNotificationSettings;
  openAlarmPermissionSettings: typeof notifee.openAlarmPermissionSettings;
};

const defaultTransport: NotificationTransport = {
  createChannel: (...args) => notifee.createChannel(...args),
  requestPermission: (...args) => notifee.requestPermission(...args),
  getNotificationSettings: () => notifee.getNotificationSettings(),
  getTriggerNotifications: () => notifee.getTriggerNotifications(),
  createTriggerNotification: (...args) =>
    notifee.createTriggerNotification(...args),
  cancelTriggerNotification: id => notifee.cancelTriggerNotification(id),
  openNotificationSettings: channelId =>
    notifee.openNotificationSettings(channelId),
  openAlarmPermissionSettings: () => notifee.openAlarmPermissionSettings(),
};

const globalTitleKeys: Record<GlobalReminderSlot, Parameters<typeof t>[0]> = {
  morning: 'notification_morning_title',
  afternoon: 'notification_afternoon_title',
  evening: 'notification_evening_title',
};

const globalBodyKeys: Record<GlobalReminderSlot, Parameters<typeof t>[0]> = {
  morning: 'notification_morning_body',
  afternoon: 'notification_afternoon_body',
  evening: 'notification_evening_body',
};

export function mapPermissionStatus(
  settings: NotificationSettings,
): NotificationPermissionStatus {
  if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED)
    return 'authorized';
  if (settings.authorizationStatus === AuthorizationStatus.PROVISIONAL)
    return 'provisional';
  if (settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED)
    return 'not_determined';
  return 'denied';
}

export function buildDesiredNotificationSchedules(
  preferences: NotificationPreferences,
  habits: HabitItem[],
  language: AppLanguage = getSelectedLanguage(),
) {
  if (!preferences.masterEnabled) return [];
  const schedules: DesiredSchedule[] = [];
  if (preferences.globalRemindersEnabled) {
    (Object.keys(GLOBAL_NOTIFICATION_IDS) as GlobalReminderSlot[]).forEach(
      slot => {
        schedules.push({
          id: GLOBAL_NOTIFICATION_IDS[slot],
          time: preferences.times[slot],
          title: t(globalTitleKeys[slot], undefined, language),
          body: t(globalBodyKeys[slot], undefined, language),
        });
      },
    );
  }
  if (preferences.habitRemindersEnabled) {
    getActiveReminderHabits(habits)
      .slice(0, MAX_HABIT_REMINDERS)
      .forEach(habit => {
        if (!isValidLocalTime(habit.reminderTime)) return;
        schedules.push({
          id: getHabitNotificationId(habit.id),
          time: habit.reminderTime,
          title: t(
            'notification_habit_notification_title',
            undefined,
            language,
          ),
          body: t(
            'notification_habit_notification_body',
            { title: habit.title },
            language,
          ),
        });
      });
  }
  return schedules;
}

function scheduleFingerprint(schedule: DesiredSchedule, exact: boolean) {
  return JSON.stringify({
    time: schedule.time,
    title: schedule.title,
    body: schedule.body,
    exact,
    smallIcon: NOTIFICATION_SMALL_ICON,
  });
}

function createNotification(
  schedule: DesiredSchedule,
  fingerprint: string,
): Notification {
  return {
    id: schedule.id,
    title: schedule.title,
    body: schedule.body,
    data: { scheduleFingerprint: fingerprint },
    android: {
      channelId: NOTIFICATION_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
      smallIcon: NOTIFICATION_SMALL_ICON,
    },
  };
}

export function isExactAlarmEnabled(
  settings: NotificationSettings,
  platform: typeof Platform.OS = Platform.OS,
) {
  return (
    platform !== 'android' ||
    settings.android.alarm === AndroidNotificationSetting.ENABLED
  );
}

function isAuthorized(status: NotificationPermissionStatus) {
  return status === 'authorized' || status === 'provisional';
}

export function createNotificationService(
  transport: NotificationTransport = defaultTransport,
) {
  async function ensureChannel(language: AppLanguage = getSelectedLanguage()) {
    if (Platform.OS !== 'android') return NOTIFICATION_CHANNEL_ID;
    return transport.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: t('notification_channel_name', undefined, language),
      importance: AndroidImportance.HIGH,
    });
  }

  const getPermissionStatus = async () =>
    mapPermissionStatus(await transport.getNotificationSettings());

  const requestPermission = async () =>
    mapPermissionStatus(await transport.requestPermission());

  async function cancelManagedNotifications(
    notifications?: TriggerNotification[],
  ) {
    const scheduled =
      notifications ?? (await transport.getTriggerNotifications());
    await Promise.all(
      scheduled
        .filter(
          item =>
            item.notification.id &&
            isManagedNotificationId(item.notification.id),
        )
        .map(item =>
          transport.cancelTriggerNotification(item.notification.id as string),
        ),
    );
  }

  async function synchronize(
    preferences: NotificationPreferences,
    habits: HabitItem[],
    language: AppLanguage = getSelectedLanguage(),
    now = new Date(),
  ): Promise<NotificationSyncResult> {
    await ensureChannel(language);
    const settings = await transport.getNotificationSettings();
    const permissionStatus = mapPermissionStatus(settings);
    const scheduled = await transport.getTriggerNotifications();
    if (!isAuthorized(permissionStatus)) {
      await cancelManagedNotifications(scheduled);
      return {
        permissionStatus,
        exactAlarmEnabled: isExactAlarmEnabled(settings),
        scheduledCount: 0,
      };
    }

    const exactAlarmEnabled = isExactAlarmEnabled(settings);
    const desired = buildDesiredNotificationSchedules(
      preferences,
      habits,
      language,
    );
    const desiredIds = new Set(desired.map(item => item.id));
    const existingById = new Map(
      scheduled
        .filter(item => item.notification.id)
        .map(item => [item.notification.id as string, item]),
    );

    await Promise.all(
      scheduled
        .filter(
          item =>
            item.notification.id &&
            isManagedNotificationId(item.notification.id) &&
            !desiredIds.has(item.notification.id),
        )
        .map(item =>
          transport.cancelTriggerNotification(item.notification.id as string),
        ),
    );

    for (const schedule of desired) {
      const fingerprint = scheduleFingerprint(schedule, exactAlarmEnabled);
      const existing = existingById.get(schedule.id);
      if (existing?.notification.data?.scheduleFingerprint === fingerprint)
        continue;
      if (existing) await transport.cancelTriggerNotification(schedule.id);
      const timestamp = getNextReminderTimestamp(schedule.time, now);
      if (!timestamp) continue;
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp,
        repeatFrequency: RepeatFrequency.DAILY,
        ...(Platform.OS === 'android' && exactAlarmEnabled
          ? {
              alarmManager: {
                type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
              },
            }
          : {}),
      };
      await transport.createTriggerNotification(
        createNotification(schedule, fingerprint),
        trigger,
      );
    }

    return {
      permissionStatus,
      exactAlarmEnabled,
      scheduledCount: desired.length,
    };
  }

  return {
    ensureChannel,
    getPermissionStatus,
    requestPermission,
    synchronize,
    cancelManagedNotifications,
    openNotificationSettings: () =>
      transport.openNotificationSettings(
        Platform.OS === 'android' ? NOTIFICATION_CHANNEL_ID : undefined,
      ),
    openAlarmPermissionSettings: () => transport.openAlarmPermissionSettings(),
  };
}

export const notificationService = createNotificationService();
