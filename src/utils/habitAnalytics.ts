import type { HabitItem, UserStats } from '../types/models';
import {
  addDays,
  fromDateKey,
  isDateKey,
  startOfWeek,
  toDateKey,
} from './dates';

export type DailyProgress = {
  applicable: number;
  completed: number;
  percentage: number;
  isPerfect: boolean;
};

export function isHabitApplicableToDate(habit: HabitItem, dateKey: string) {
  if (habit.archived || !isDateKey(dateKey)) return false;
  if (
    habit.createdAt &&
    isDateKey(habit.createdAt) &&
    habit.createdAt > dateKey
  )
    return false;

  const day = fromDateKey(dateKey).getDay();
  return habit.frequency !== 'WEEKDAYS' || (day !== 0 && day !== 6);
}

export function getApplicableHabits(habits: HabitItem[], dateKey: string) {
  return habits.filter(habit => isHabitApplicableToDate(habit, dateKey));
}

export function getDailyProgress(
  habits: HabitItem[],
  dateKey: string,
  completionCutoffKey = toDateKey(new Date()),
): DailyProgress {
  const applicableHabits = getApplicableHabits(habits, dateKey);
  const completed =
    dateKey <= completionCutoffKey
      ? applicableHabits.filter(habit => habit.completedDates.includes(dateKey))
          .length
      : 0;
  const applicable = applicableHabits.length;
  return {
    applicable,
    completed,
    percentage: applicable ? Math.round((completed / applicable) * 100) : 0,
    isPerfect: applicable > 0 && completed === applicable,
  };
}

function getRelevantStartDate(habits: HabitItem[], fallback: string) {
  const keys = habits.flatMap(habit => [
    ...(habit.createdAt && isDateKey(habit.createdAt) ? [habit.createdAt] : []),
    ...habit.completedDates.filter(isDateKey),
  ]);
  return keys.sort()[0] ?? fallback;
}

export function getDateRange(startKey: string, endKey: string) {
  if (!isDateKey(startKey) || !isDateKey(endKey) || startKey > endKey)
    return [];
  const end = fromDateKey(endKey);
  const result: string[] = [];
  for (let date = fromDateKey(startKey); date <= end; date = addDays(date, 1)) {
    result.push(toDateKey(date));
  }
  return result;
}

export function calculateHabitStreak(
  habit: HabitItem,
  endDateKey = toDateKey(new Date()),
) {
  const start = getRelevantStartDate([habit], endDateKey);
  let streak = 0;
  for (const date of getDateRange(start, endDateKey).reverse()) {
    if (!isHabitApplicableToDate(habit, date)) continue;
    if (!habit.completedDates.includes(date)) break;
    streak += 1;
  }
  return streak;
}

export function calculateStats(
  habits: HabitItem[],
  endDateKey = toDateKey(new Date()),
  unlockedAchievements: string[] = [],
): UserStats {
  const activeHabits = habits.filter(habit => !habit.archived);
  const start = getRelevantStartDate(activeHabits, endDateKey);
  const progress = getDateRange(start, endDateKey).map(date => ({
    date,
    ...getDailyProgress(activeHabits, date, endDateKey),
  }));

  let running = 0;
  let bestStreak = 0;
  let perfectDays = 0;
  progress.forEach(day => {
    if (day.applicable === 0) return;
    if (day.isPerfect) {
      running += 1;
      perfectDays += 1;
      bestStreak = Math.max(bestStreak, running);
    } else {
      running = 0;
    }
  });

  let currentStreak = 0;
  for (const day of progress.slice().reverse()) {
    if (day.applicable === 0) continue;
    if (!day.isPerfect) break;
    currentStreak += 1;
  }

  return {
    currentStreak,
    bestStreak,
    habitsFinishedTotal: activeHabits.reduce(
      (total, habit) =>
        total +
        new Set(
          habit.completedDates.filter(
            date => date <= endDateKey && isHabitApplicableToDate(habit, date),
          ),
        ).size,
      0,
    ),
    perfectDays,
    unlockedAchievements,
  };
}

export function calculateCurrentWeekMetrics(
  habits: HabitItem[],
  today = new Date(),
) {
  const todayKey = toDateKey(today);
  const weekStart = toDateKey(startOfWeek(today));
  const daily = getDateRange(weekStart, todayKey).map(date =>
    getDailyProgress(habits, date, todayKey),
  );
  const completed = daily.reduce((sum, day) => sum + day.completed, 0);
  const applicable = daily.reduce((sum, day) => sum + day.applicable, 0);
  return {
    completed,
    applicable,
    percentage: applicable ? Math.round((completed / applicable) * 100) : 0,
    perfectDays: daily.filter(day => day.isPerfect).length,
  };
}
