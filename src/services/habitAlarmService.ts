import notifee, {
  AlarmType,
  EventType,
  TriggerType,
  type Event,
  type Notification,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { habitRepository } from '../database/repositories/habitRepository';
import { notificationSettingsStorage } from '../storage/notificationSettingsStorage';
import { storage } from '../storage/storage';
import {
  ALARM_DISMISS,
  ALARM_SNOOZE,
  ALARM_SNOOZE_MINUTES,
  getSnoozeId,
  habitAlertFingerprint,
} from '../utils/habitAlerts';
import {
  getActiveReminderHabits,
  MAX_HABIT_REMINDERS,
} from '../utils/notifications';
import { isHabitApplicableToDate } from '../utils/habitAnalytics';
import { isDateKey } from '../utils/dates';
import { asAlarmNotification, ensureAlarmSupport } from './alarmNotification';
import { serializeHabitAlerts } from './habitAlertQueue';
import {
  isExactAlarmEnabled,
  notificationService,
} from './notificationService';
import { alarmNative } from './alarmNative';

const RECEIPTS_KEY = 'notifications.alarmActions.v1';
function readReceipts(): string[] {
  try {
    const value: unknown = JSON.parse(storage.getString(RECEIPTS_KEY) ?? '[]');
    return Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === 'string')
          .slice(-100)
      : [];
  } catch {
    return [];
  }
}

export async function getActiveAlarmHabit(notification: Notification) {
  const settings = notificationSettingsStorage.getSettings();
  if (
    !settings.masterEnabled ||
    !settings.habitRemindersEnabled ||
    notification.data?.alertType !== 'alarm'
  )
    return undefined;
  const habits = await habitRepository.loadAllHabits();
  return getActiveReminderHabits(habits)
    .slice(0, MAX_HABIT_REMINDERS)
    .find(
      habit =>
        habit.id === notification.data?.habitId &&
        habit.reminderType === 'alarm' &&
        habitAlertFingerprint(habit) === notification.data?.configFingerprint &&
        isDateKey(notification.data?.dateKey) &&
        isHabitApplicableToDate(habit, notification.data.dateKey),
    );
}

export function performAlarmAction(
  notification: Notification,
  action: typeof ALARM_DISMISS | typeof ALARM_SNOOZE,
  now = Date.now(),
) {
  return serializeHabitAlerts(async () => {
    if (!notification.id || notification.data?.alertType !== 'alarm') return;
    const receipt = `${notification.id}:${notification.data.occurrenceTime}`;
    const receipts = readReceipts();
    if (receipts.includes(receipt)) return;
    const habit = await getActiveAlarmHabit(notification);
    if (action === ALARM_SNOOZE && habit) {
      const id = getSnoozeId(habit.id);
      const existing = (await notifee.getTriggerNotifications()).find(
        item => item.notification.id === id,
      );
      if (existing?.notification.data?.sourceOccurrence !== receipt) {
        const timestamp = now + ALARM_SNOOZE_MINUTES * 60 * 1000;
        const fullScreen = await ensureAlarmSupport();
        const exact = isExactAlarmEnabled(
          await notifee.getNotificationSettings(),
        );
        await notifee.createTriggerNotification(
          asAlarmNotification(
            {
              ...notification,
              id,
              data: {
                ...notification.data,
                sourceOccurrence: receipt,
                occurrenceTime: String(timestamp),
              },
            },
            fullScreen,
          ),
          {
            type: TriggerType.TIMESTAMP,
            timestamp,
            ...(Platform.OS === 'android'
              ? {
                  alarmManager: {
                    type: exact
                      ? AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE
                      : AlarmType.SET_AND_ALLOW_WHILE_IDLE,
                  },
                }
              : {}),
          },
        );
      }
    }
    // Cancels sound/vibration without cancelling the next primary occurrence (or snooze).
    await notifee.cancelDisplayedNotification(notification.id);
    if (
      !storage.setString(
        RECEIPTS_KEY,
        JSON.stringify([...receipts, receipt].slice(-100)),
      )
    ) {
      throw new Error('ALARM_RECEIPT_WRITE');
    }
  });
}

export async function reconcileHabitAlerts() {
  await notificationService.synchronize(
    notificationSettingsStorage.getSettings(),
    await habitRepository.loadAllHabits(),
  );
}

export async function handleHabitAlarmEvent(event: Event) {
  const { notification, pressAction } = event.detail;
  if (!notification) return;
  if (
    event.type === EventType.ACTION_PRESS &&
    (pressAction?.id === ALARM_SNOOZE || pressAction?.id === ALARM_DISMISS)
  ) {
    await performAlarmAction(notification, pressAction.id);
    await alarmNative.closeAlarm(
      notification.id,
      String(notification.data?.occurrenceTime ?? ''),
    );
  }
  if (
    event.type === EventType.DELIVERED ||
    event.type === EventType.ACTION_PRESS ||
    event.type === EventType.DISMISSED
  ) {
    await reconcileHabitAlerts();
  }
}
