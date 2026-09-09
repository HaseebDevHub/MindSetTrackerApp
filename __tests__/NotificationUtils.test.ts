import type { HabitItem } from '../src/types/models';
import {
  GLOBAL_NOTIFICATION_IDS,
  MAX_HABIT_REMINDERS,
  canEnableHabitReminder,
  getActiveReminderHabits,
  getExcessReminderHabitIds,
  getHabitNotificationId,
  getNextReminderTimestamp,
} from '../src/utils/notifications';

function reminderHabit(
  id: string,
  createdAt: string,
  overrides: Partial<HabitItem> = {},
): HabitItem {
  return {
    id,
    title: id,
    timeOfDay: 'ANYTIME',
    completedDates: [],
    streakCount: 0,
    iconName: 'Bell',
    createdAt,
    reminderEnabled: true,
    reminderTime: '09:00',
    ...overrides,
  };
}

describe('notification time helpers', () => {
  test('uses a later time on the same local day', () => {
    const now = new Date(2026, 8, 8, 10, 15, 0);
    const timestamp = getNextReminderTimestamp('13:00', now);

    expect(new Date(timestamp!)).toEqual(new Date(2026, 8, 8, 13, 0, 0));
  });

  test('moves a passed time to tomorrow using local calendar semantics', () => {
    const now = new Date(2026, 11, 31, 23, 30, 0);
    const timestamp = getNextReminderTimestamp('08:00', now);

    expect(new Date(timestamp!)).toEqual(new Date(2027, 0, 1, 8, 0, 0));
  });

  test('moves an equal time to the next day', () => {
    const now = new Date(2026, 0, 31, 0, 0, 0);
    const timestamp = getNextReminderTimestamp('00:00', now);

    expect(new Date(timestamp!)).toEqual(new Date(2026, 1, 1, 0, 0, 0));
  });

  test('rejects malformed local times', () => {
    expect(getNextReminderTimestamp('8 PM')).toBeUndefined();
  });
});

describe('habit reminder limits and IDs', () => {
  const habits = [
    reminderHabit('third', '2026-03-03'),
    reminderHabit('first', '2026-03-01'),
    reminderHabit('second', '2026-03-02'),
    reminderHabit('archived', '2026-02-01', { archived: true }),
  ];

  test('uses stable deterministic IDs', () => {
    expect(GLOBAL_NOTIFICATION_IDS).toEqual({
      morning: 'global-morning-reminder',
      afternoon: 'global-afternoon-reminder',
      evening: 'global-evening-reminder',
    });
    expect(getHabitNotificationId('habit-42')).toBe('habit-reminder-habit-42');
  });

  test('orders active reminder preferences by creation date and ID', () => {
    expect(getActiveReminderHabits(habits).map(habit => habit.id)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  test('allows editing an enabled reminder but blocks a third one', () => {
    const twoActive = habits.filter(habit => habit.id !== 'third');
    expect(MAX_HABIT_REMINDERS).toBe(2);
    expect(canEnableHabitReminder(twoActive, 'first')).toBe(true);
    expect(canEnableHabitReminder(twoActive)).toBe(false);
    expect(
      canEnableHabitReminder(habits.filter(habit => habit.id === 'first')),
    ).toBe(true);
  });

  test('selects only excess active reminders for legacy normalization', () => {
    expect(getExcessReminderHabitIds(habits)).toEqual(['third']);
  });
});
