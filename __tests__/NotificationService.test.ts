import {
  AndroidNotificationSetting,
  AuthorizationStatus,
  type Notification,
  type NotificationSettings,
  type TimestampTrigger,
  type Trigger,
  type TriggerNotification,
} from '@notifee/react-native';
import {
  buildDesiredNotificationSchedules,
  createNotificationService,
  isExactAlarmEnabled,
  type NotificationTransport,
} from '../src/services/notificationService';
import type { HabitItem } from '../src/types/models';
import type { NotificationPreferences } from '../src/types/notification';

const preferences: NotificationPreferences = {
  version: 1,
  masterEnabled: true,
  globalRemindersEnabled: true,
  habitRemindersEnabled: true,
  times: { morning: '08:00', afternoon: '13:00', evening: '20:00' },
};

const habits: HabitItem[] = Array.from({ length: 3 }, (_, index) => ({
  id: `habit-${index + 1}`,
  title: `Habit ${index + 1}`,
  timeOfDay: 'ANYTIME',
  completedDates: [],
  streakCount: 0,
  iconName: 'Bell',
  createdAt: `2026-09-0${index + 1}`,
  reminderEnabled: true,
  reminderTime: `1${index}:00`,
}));

function authorizedSettings(): NotificationSettings {
  return {
    authorizationStatus: AuthorizationStatus.AUTHORIZED,
    android: { alarm: AndroidNotificationSetting.ENABLED },
  } as NotificationSettings;
}

function createTransport() {
  const triggers: TriggerNotification[] = [];
  const transport: NotificationTransport = {
    createChannel: jest.fn(async ({ id }) => id),
    requestPermission: jest.fn(async () => authorizedSettings()),
    getNotificationSettings: jest.fn(async () => authorizedSettings()),
    getTriggerNotifications: jest.fn(async () => [...triggers]),
    createTriggerNotification: jest.fn(
      async (notification: Notification, trigger: Trigger) => {
        triggers.push({ notification, trigger: trigger as TimestampTrigger });
        return notification.id ?? '';
      },
    ),
    cancelTriggerNotification: jest.fn(async id => {
      const index = triggers.findIndex(item => item.notification.id === id);
      if (index >= 0) triggers.splice(index, 1);
    }),
    openNotificationSettings: jest.fn(async () => undefined),
    openAlarmPermissionSettings: jest.fn(async () => undefined),
  };
  return { transport, triggers };
}

describe('notification scheduling service', () => {
  test('falls back when Android exact-alarm access is disabled', () => {
    const settings = {
      ...authorizedSettings(),
      android: { alarm: AndroidNotificationSetting.DISABLED },
    } as NotificationSettings;

    expect(isExactAlarmEnabled(settings, 'android')).toBe(false);
    expect(isExactAlarmEnabled(settings, 'ios')).toBe(true);
  });

  test('caps managed schedules at three globals and two habits', () => {
    expect(
      buildDesiredNotificationSchedules(preferences, habits, 'English'),
    ).toHaveLength(5);
  });

  test('creates missing schedules and does not duplicate unchanged ones', async () => {
    const { transport, triggers } = createTransport();
    const service = createNotificationService(transport);
    const now = new Date(2026, 8, 8, 7, 0, 0);

    const first = await service.synchronize(
      preferences,
      habits,
      'English',
      now,
    );
    expect(first.scheduledCount).toBe(5);
    expect(triggers).toHaveLength(5);
    expect(triggers[0].notification.android?.smallIcon).toBe(
      'ic_notification',
    );

    await service.synchronize(preferences, habits, 'English', now);
    expect(triggers).toHaveLength(5);
    expect(transport.createTriggerNotification).toHaveBeenCalledTimes(5);
  });

  test('cancels only managed schedules when permission is denied', async () => {
    const { transport, triggers } = createTransport();
    triggers.push(
      {
        notification: { id: 'global-morning-reminder' },
        trigger: { type: 0, timestamp: Date.now() },
      } as TriggerNotification,
      {
        notification: { id: 'another-feature-notification' },
        trigger: { type: 0, timestamp: Date.now() },
      } as TriggerNotification,
    );
    (transport.getNotificationSettings as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.DENIED,
      android: { alarm: AndroidNotificationSetting.DISABLED },
    });

    const result = await createNotificationService(transport).synchronize(
      preferences,
      habits,
    );

    expect(result.scheduledCount).toBe(0);
    expect(transport.cancelTriggerNotification).toHaveBeenCalledWith(
      'global-morning-reminder',
    );
    expect(transport.cancelTriggerNotification).not.toHaveBeenCalledWith(
      'another-feature-notification',
    );
  });
});
