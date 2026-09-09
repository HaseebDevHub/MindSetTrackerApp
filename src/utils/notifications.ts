import type { HabitItem } from '../types/models';
import type { GlobalReminderSlot } from '../types/notification';
import { addDays } from './dates';
import { isValidLocalTime } from './time';

export const MAX_HABIT_REMINDERS = 2;
export const NOTIFICATION_CHANNEL_ID = 'mindset-reminders';

export const GLOBAL_NOTIFICATION_IDS: Record<GlobalReminderSlot, string> = {
  morning: 'global-morning-reminder',
  afternoon: 'global-afternoon-reminder',
  evening: 'global-evening-reminder',
};

export const getHabitNotificationId = (habitId: string) =>
  `habit-reminder-${habitId}`;

export function getActiveReminderHabits(habits: HabitItem[]) {
  return habits
    .filter(habit => !habit.archived && habit.reminderEnabled === true)
    .sort((left, right) => {
      const byDate = (left.createdAt ?? '').localeCompare(
        right.createdAt ?? '',
      );
      return byDate || left.id.localeCompare(right.id);
    });
}

export function canEnableHabitReminder(
  habits: HabitItem[],
  currentHabitId?: string,
) {
  return (
    getActiveReminderHabits(habits).filter(habit => habit.id !== currentHabitId)
      .length < MAX_HABIT_REMINDERS
  );
}

export function getExcessReminderHabitIds(habits: HabitItem[]) {
  return getActiveReminderHabits(habits)
    .slice(MAX_HABIT_REMINDERS)
    .map(habit => habit.id);
}

export function getNextReminderTimestamp(time: string, now = new Date()) {
  if (!isValidLocalTime(time)) return undefined;
  const [hour, minute] = time.split(':').map(Number);
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) return addDays(next, 1).getTime();
  return next.getTime();
}

export function isManagedNotificationId(id: string) {
  return (
    Object.values(GLOBAL_NOTIFICATION_IDS).includes(id) ||
    id.startsWith('habit-reminder-')
  );
}
