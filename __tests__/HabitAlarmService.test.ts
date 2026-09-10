import notifee, { EventType, type Notification } from '@notifee/react-native';
import { habitRepository } from '../src/database/repositories/habitRepository';
import {
  getActiveAlarmHabit,
  handleHabitAlarmEvent,
  performAlarmAction,
} from '../src/services/habitAlarmService';
import { notificationSettingsStorage } from '../src/storage/notificationSettingsStorage';
import { storage } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/storageKeys';
import {
  ALARM_DISMISS,
  ALARM_SNOOZE,
  habitAlertFingerprint,
} from '../src/utils/habitAlerts';
import type { HabitItem } from '../src/types/models';

const habit: HabitItem = {
  id: 'alarm',
  title: 'Walk',
  iconName: 'Footprints',
  timeOfDay: 'ANYTIME',
  completedDates: [],
  streakCount: 0,
  reminderEnabled: true,
  reminderType: 'alarm',
  reminderTime: '09:00',
};
const notification: Notification = {
  id: 'habit-alarm-alarm-2026-09-08',
  title: 'Habit alarm',
  body: 'Walk',
  data: {
    habitId: habit.id,
    alertType: 'alarm',
    dateKey: '2026-09-08',
    occurrenceTime: '100000',
    configFingerprint: habitAlertFingerprint(habit),
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  storage.remove(STORAGE_KEYS.ALARM_ACTION_RECEIPTS);
  notificationSettingsStorage.setSettings({
    version: 1,
    masterEnabled: true,
    globalRemindersEnabled: false,
    habitRemindersEnabled: true,
    times: { morning: '08:00', afternoon: '13:00', evening: '20:00' },
  });
  (habitRepository.loadAllHabits as jest.Mock).mockResolvedValue([habit]);
  (notifee.getTriggerNotifications as jest.Mock).mockResolvedValue([]);
});
test('Snooze creates one temporary ten-minute alarm, does not alter habits, and coalesces duplicate actions', async () => {
  await Promise.all([
    performAlarmAction(notification, ALARM_SNOOZE, 100000),
    performAlarmAction(notification, ALARM_SNOOZE, 100000),
  ]);
  expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(1);
  expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'habit-alarm-snooze-alarm',
      ios: expect.objectContaining({ interruptionLevel: 'timeSensitive' }),
    }),
    expect.objectContaining({ timestamp: 700000 }),
  );
  expect(notifee.cancelDisplayedNotification).toHaveBeenCalledWith(
    notification.id,
  );
  expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled();
});
test('Dismiss cancels only the displayed occurrence and retains primary triggers', async () => {
  await performAlarmAction(notification, ALARM_DISMISS);
  expect(notifee.cancelDisplayedNotification).toHaveBeenCalledWith(
    notification.id,
  );
  expect(notifee.cancelTriggerNotification).not.toHaveBeenCalled();
  expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
});
test.each([
  { archived: true },
  { reminderEnabled: false },
  { reminderType: 'reminder' as const },
  { reminderTime: '10:00' },
])('stale actions cannot resurrect changed alerts %s', async patch => {
  (habitRepository.loadAllHabits as jest.Mock).mockResolvedValue([
    { ...habit, ...patch },
  ]);
  expect(await getActiveAlarmHabit(notification)).toBeUndefined();
  await performAlarmAction(notification, ALARM_SNOOZE);
  expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
});
test('background Dismiss performs the same action and refreshes future dates', async () => {
  await handleHabitAlarmEvent({
    type: EventType.ACTION_PRESS,
    detail: { notification, pressAction: { id: ALARM_DISMISS } },
  });
  expect(notifee.cancelDisplayedNotification).toHaveBeenCalledWith(
    notification.id,
  );
  expect(notifee.createTriggerNotification).toHaveBeenCalled();
});
test('failed snooze scheduling does not mutate the habit or consume the action', async () => {
  (notifee.createTriggerNotification as jest.Mock).mockRejectedValueOnce(
    new Error('OS failure'),
  );
  await expect(performAlarmAction(notification, ALARM_SNOOZE)).rejects.toThrow(
    'OS failure',
  );
  expect(notifee.cancelDisplayedNotification).not.toHaveBeenCalled();
  await performAlarmAction(notification, ALARM_SNOOZE);
  expect(notifee.cancelDisplayedNotification).toHaveBeenCalled();
});
