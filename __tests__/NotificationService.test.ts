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
import { Platform } from 'react-native';
import { getSnoozeId } from '../src/utils/habitAlerts';

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
        const previous = triggers.findIndex(
          item => item.notification.id === notification.id,
        );
        if (previous >= 0) triggers.splice(previous, 1);
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
  afterEach(() => jest.restoreAllMocks());
  test.each([true, false])(
    'Alarm uses full screen only when allowed (%s), while globals remain normal',
    async fullScreen => {
      jest.replaceProperty(Platform, 'OS', 'android');
      const { transport, triggers } = createTransport();
      const service = createNotificationService(
        transport,
        async () => fullScreen,
      );
      const now = new Date(2026, 8, 8, 7);
      const alarm = { ...habits[0], reminderType: 'alarm' as const };
      await service.synchronize(preferences, [alarm], 'English', now);
      const occurrence = triggers.find(
        item => item.notification.data?.alertType === 'alarm',
      )!;
      expect(occurrence.notification.android).toMatchObject({
        channelId: 'mindset-habit-alarms',
        category: 'alarm',
        loopSound: true,
      });
      expect(Boolean(occurrence.notification.android?.fullScreenAction)).toBe(
        fullScreen,
      );
      expect(
        occurrence.notification.android?.actions?.map(
          item => item.pressAction.id,
        ),
      ).toEqual(['habit-alarm-snooze', 'habit-alarm-dismiss']);
      expect(occurrence.trigger).not.toHaveProperty('repeatFrequency');
      expect(triggers[0].notification.android?.channelId).toBe(
        'mindset-reminders',
      );
      expect(triggers[0].trigger).toHaveProperty('repeatFrequency');
    },
  );
  test('Android without exact access uses inexact AlarmManager only for Alarm', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { transport, triggers } = createTransport();
    (transport.getNotificationSettings as jest.Mock).mockResolvedValue({
      ...authorizedSettings(),
      android: { alarm: AndroidNotificationSetting.DISABLED },
    });
    await createNotificationService(transport, async () => false).synchronize(
      preferences,
      [{ ...habits[0], reminderType: 'alarm' }],
    );
    expect((triggers[3].trigger as TimestampTrigger).alarmManager).toEqual({
      type: 1,
    });
    expect(
      (triggers[0].trigger as TimestampTrigger).alarmManager,
    ).toBeUndefined();
  });
  test('replaces both type directions, clears stale snoozes and displayed alarms, and cancels disabled/deleted habits', async () => {
    const { transport, triggers } = createTransport();
    const service = createNotificationService(transport, async () => false);
    const now = new Date(2026, 8, 8, 7);
    await service.synchronize(preferences, [habits[0]], 'English', now);
    await service.synchronize(
      preferences,
      [{ ...habits[0], reminderType: 'alarm' }],
      'English',
      now,
    );
    expect(
      triggers.some(item =>
        item.notification.id?.startsWith('habit-reminder-'),
      ),
    ).toBe(false);
    const alarm = triggers[3];
    triggers.push({
      ...alarm,
      notification: { ...alarm.notification, id: getSnoozeId(habits[0].id) },
    });
    transport.getDisplayedNotifications = jest.fn(async () => [
      { notification: alarm.notification, trigger: alarm.trigger },
    ]);
    transport.cancelDisplayedNotification = jest.fn(async () => undefined);
    await service.synchronize(
      preferences,
      [{ ...habits[0], reminderType: 'reminder', reminderTime: '16:00' }],
      'English',
      now,
    );
    expect(
      triggers.some(item => item.notification.id?.startsWith('habit-alarm-')),
    ).toBe(false);
    expect(transport.cancelDisplayedNotification).toHaveBeenCalledWith(
      alarm.notification.id,
    );
    expect(triggers[3].notification.body).toBe('Time for “Habit 1”');
    await service.synchronize(
      preferences,
      [{ ...habits[0], reminderEnabled: false }],
      'English',
      now,
    );
    expect(triggers).toHaveLength(3);
    await service.synchronize(preferences, [], 'English', now);
    expect(triggers).toHaveLength(3);
  });
  test('falls back when Android exact-alarm access is disabled', () => {
    const settings = {
      ...authorizedSettings(),
      android: { alarm: AndroidNotificationSetting.DISABLED },
    } as NotificationSettings;

    expect(isExactAlarmEnabled(settings, 'android')).toBe(false);
    expect(isExactAlarmEnabled(settings, 'ios')).toBe(true);
  });

  test('caps managed schedules at three globals and twenty occurrences for each of two habits', () => {
    expect(
      buildDesiredNotificationSchedules(preferences, habits, 'English'),
    ).toHaveLength(43);
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
    expect(first.scheduledCount).toBe(43);
    expect(triggers).toHaveLength(43);
    expect(triggers[0].notification.android?.smallIcon).toBe('ic_notification');

    await service.synchronize(preferences, habits, 'English', now);
    expect(triggers).toHaveLength(43);
    expect(transport.createTriggerNotification).toHaveBeenCalledTimes(43);
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
