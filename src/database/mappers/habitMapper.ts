import type HabitCompletion from '../models/HabitCompletion';
import type Habit from '../models/Habit';
import type { HabitItem } from '../../types/models';

export function mapHabitRecord(
  habit: Habit,
  completions: readonly HabitCompletion[] = [],
): HabitItem {
  return {
    id: habit.id,
    title: habit.title,
    timeOfDay: habit.timeOfDay,
    frequency: habit.frequency,
    iconName: habit.iconName,
    note: habit.note ?? undefined,
    reminderEnabled: habit.isReminderEnabled,
    reminderTime: habit.reminderTime ?? undefined,
    archived: habit.isArchived,
    createdAt: habit.createdDateKey,
    completedDates: [
      ...new Set(
        completions
          .filter(completion => completion.habitId === habit.id)
          .map(completion => completion.dateKey),
      ),
    ].sort(),
    streakCount: 0,
  };
}
