import type { HabitItem, TodayFilter } from '../types/models';
import { getDateStatus } from './dates';
import {
  isHabitApplicableToDate,
  isHabitCompleteOnDate,
} from './habitAnalytics';

export const isHabitVisibleForTodayFilter = (
  habit: HabitItem,
  filter: TodayFilter,
  date?: string,
) =>
  !habit.archived &&
  (!date || isHabitApplicableToDate(habit, date)) &&
  (filter === 'ALL' ||
    habit.timeOfDay === filter ||
    habit.timeOfDay === 'ANYTIME');

export function partitionHabitsByCompletion(habits: HabitItem[], date: string) {
  if (getDateStatus(date) === 'future') {
    return { active: habits, finished: [] as HabitItem[] };
  }

  const active: HabitItem[] = [];
  const finished: HabitItem[] = [];

  habits.forEach(habit => {
    if (isHabitCompleteOnDate(habit, date)) finished.push(habit);
    else active.push(habit);
  });

  return { active, finished };
}
