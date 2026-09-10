import type { HabitItem } from '../types/models';
import { addDays, fromDateKey, isDateKey, toDateKey } from './dates';
import { isHabitApplicableToDate } from './habitAnalytics';
import {
  normalizeHabitAlertType,
  normalizeScheduleMode,
} from './habitSchedule';
import { isValidLocalTime } from './time';

// 40 habit occurrences + 3 global triggers + 2 snoozes stay below Android's
// 50 timestamp-trigger and iOS's 64 pending-notification limits.
export const HABIT_ALERT_OCCURRENCES = 20;
export const ALARM_SNOOZE_MINUTES = 10;
export const ALARM_CHANNEL_ID = 'mindset-habit-alarms';
export const ALARM_CATEGORY_ID = 'habit-alarm-actions';
export const ALARM_ACTIVITY = 'com.mindsettracker.AlarmActivity';
export const ALARM_COMPONENT = 'MindsetHabitAlarm';
export const ALARM_DISMISS = 'habit-alarm-dismiss';
export const ALARM_SNOOZE = 'habit-alarm-snooze';
export const NOTIFICATION_SMALL_ICON = 'ic_notification';

export const getSnoozeId = (id: string) => `habit-alarm-snooze-${id}`;
export const getHabitOccurrenceId = (habit: HabitItem, date: string) =>
  `habit-${normalizeHabitAlertType(habit.reminderType)}-${habit.id}-${date}`;

// Deliberately excludes completion state: completing a habit is not disabling its alert.
export function habitAlertFingerprint(habit: HabitItem) {
  return JSON.stringify([
    habit.id,
    habit.title,
    normalizeHabitAlertType(habit.reminderType),
    habit.reminderTime,
    habit.reminderEnabled,
    Boolean(habit.archived),
    habit.createdAt,
    habit.endDate,
    habit.targetDate,
    habit.habitType,
    normalizeScheduleMode(habit.scheduleMode, habit.frequency),
    habit.selectedWeekdays,
  ]);
}

export function getHabitAlertOccurrences(habit: HabitItem, now = new Date()) {
  if (
    habit.archived ||
    !habit.reminderEnabled ||
    !isValidLocalTime(habit.reminderTime)
  )
    return [];
  const [hour, minute] = habit.reminderTime.split(':').map(Number);
  let first = toDateKey(now);
  if (isDateKey(habit.createdAt) && habit.createdAt > first)
    first = habit.createdAt;
  if (
    (habit.habitType === 'ONE_TIME' || habit.scheduleMode === 'ONE_TIME') &&
    isDateKey(habit.targetDate) &&
    habit.targetDate > first
  )
    first = habit.targetDate;
  const occurrences: { dateKey: string; timestamp: number }[] = [];
  for (
    let offset = 0;
    offset < 366 && occurrences.length < HABIT_ALERT_OCCURRENCES;
    offset++
  ) {
    const date = addDays(fromDateKey(first), offset);
    const dateKey = toDateKey(date);
    if (habit.endDate && dateKey > habit.endDate) break;
    if (!isHabitApplicableToDate(habit, dateKey)) continue;
    date.setHours(hour, minute, 0, 0);
    if (date.getTime() > now.getTime())
      occurrences.push({ dateKey, timestamp: date.getTime() });
  }
  return occurrences;
}
