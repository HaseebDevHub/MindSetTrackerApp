import type { HabitItem, TodayFilter } from '../types/models';

export const isHabitVisibleForTodayFilter = (
  habit: HabitItem,
  filter: TodayFilter,
) =>
  !habit.archived &&
  (filter === 'ALL' ||
    habit.timeOfDay === filter ||
    habit.timeOfDay === 'ANYTIME');

export function partitionHabitsByCompletion(habits: HabitItem[], date: string) {
  const active: HabitItem[] = [];
  const finished: HabitItem[] = [];

  habits.forEach(habit => {
    if (habit.completedDates.includes(date)) finished.push(habit);
    else active.push(habit);
  });

  return { active, finished };
}
