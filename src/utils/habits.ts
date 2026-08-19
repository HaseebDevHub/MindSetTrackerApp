import type { HabitItem, TodayFilter } from '../types/models';

export const isHabitVisibleForTodayFilter = (
  habit: HabitItem,
  filter: TodayFilter,
) =>
  !habit.archived &&
  (filter === 'ALL' ||
    habit.timeOfDay === filter ||
    habit.timeOfDay === 'ANYTIME');
