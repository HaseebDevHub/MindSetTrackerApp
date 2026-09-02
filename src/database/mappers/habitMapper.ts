import type HabitCompletion from '../models/HabitCompletion';
import type Habit from '../models/Habit';
import type { HabitItem } from '../../types/models';
import {
  decodeWeekdays,
  normalizeGoalMode,
  normalizeHabitType,
  normalizeScheduleMode,
} from '../../utils/habitSchedule';
import { normalizeHabitColor } from '../../constants/habitColors';

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
    archivedAt: habit.archivedDateKey ?? undefined,
    createdAt: habit.createdDateKey,
    habitType: normalizeHabitType(habit.habitType),
    color: normalizeHabitColor(habit.color),
    scheduleMode: normalizeScheduleMode(habit.scheduleMode, habit.frequency),
    selectedWeekdays: decodeWeekdays(habit.selectedWeekdays),
    quotaCount: habit.quotaCount ?? undefined,
    endDate: habit.endDateKey ?? undefined,
    targetDate: habit.targetDateKey ?? undefined,
    goalMode: normalizeGoalMode(habit.goalMode),
    goalTarget: habit.goalTarget ?? undefined,
    goalUnit: habit.goalUnit ?? undefined,
    motivationalText: habit.motivationalText ?? undefined,
    progressEntries: completions.map(completion => ({
      dateKey: completion.dateKey,
      actionType: completion.actionType ?? 'COMPLETION',
      value: completion.progressValue ?? 1,
    })),
    completedDates: [
      ...new Set(
        completions
          .filter(
            completion =>
              completion.habitId === habit.id &&
              (completion.actionType === null ||
                completion.actionType === 'COMPLETION'),
          )
          .map(completion => completion.dateKey),
      ),
    ].sort(),
    streakCount: 0,
  };
}
