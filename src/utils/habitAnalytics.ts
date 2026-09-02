import type { HabitItem, UserStats, WeekStartsOn } from '../types/models';
import {
  addDays,
  fromDateKey,
  getWeekDateKeys,
  isDateKey,
  startOfWeek,
  toDateKey,
} from './dates';
import {
  normalizeGoalMode,
  normalizeHabitType,
  normalizeScheduleMode,
  normalizeWeekdays,
} from './habitSchedule';

export type DailyProgress = {
  applicable: number;
  completed: number;
  percentage: number;
  isPerfect: boolean;
};

export type HabitQuotaProgress = {
  completed: number;
  target: number;
  percentage: number;
  periodLabel: 'week' | 'month' | 'year';
  startKey: string;
  endKey: string;
};

export function isLongTermHabit(habit: HabitItem) {
  const mode = normalizeScheduleMode(habit.scheduleMode, habit.frequency);
  return mode === 'MONTHLY_QUOTA' || mode === 'YEARLY_QUOTA';
}

export function getHabitQuotaProgress(
  habit: HabitItem,
  dateKey: string,
  weekStartsOn: WeekStartsOn = 0,
): HabitQuotaProgress | undefined {
  if (!isDateKey(dateKey)) return undefined;
  const mode = normalizeScheduleMode(habit.scheduleMode, habit.frequency);
  if (
    mode !== 'WEEKLY_QUOTA' &&
    mode !== 'MONTHLY_QUOTA' &&
    mode !== 'YEARLY_QUOTA'
  ) {
    return undefined;
  }

  const date = fromDateKey(dateKey);
  const start =
    mode === 'WEEKLY_QUOTA'
      ? startOfWeek(date, weekStartsOn)
      : mode === 'MONTHLY_QUOTA'
      ? new Date(date.getFullYear(), date.getMonth(), 1)
      : new Date(date.getFullYear(), 0, 1);
  const end =
    mode === 'WEEKLY_QUOTA'
      ? addDays(start, 6)
      : mode === 'MONTHLY_QUOTA'
      ? new Date(date.getFullYear(), date.getMonth() + 1, 0)
      : new Date(date.getFullYear(), 11, 31);
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);
  const successfulDates = new Set(
    [
      ...habit.completedDates,
      ...(habit.progressEntries ?? [])
        .filter(
          entry =>
            entry.actionType === 'PROGRESS' &&
            entry.value >= (habit.goalTarget ?? 1),
        )
        .map(entry => entry.dateKey),
    ].filter(
      key =>
        isDateKey(key) &&
        key >= startKey &&
        key <= endKey &&
        isHabitApplicableToDate(habit, key),
    ),
  );
  const target = Math.max(1, Math.floor(habit.quotaCount ?? 1));
  const completed = successfulDates.size;
  return {
    completed,
    target,
    percentage: Math.min(100, Math.round((completed / target) * 100)),
    periodLabel:
      mode === 'WEEKLY_QUOTA'
        ? 'week'
        : mode === 'MONTHLY_QUOTA'
        ? 'month'
        : 'year',
    startKey,
    endKey,
  };
}

export function isHabitApplicableToDate(habit: HabitItem, dateKey: string) {
  if (!isDateKey(dateKey)) return false;
  if (habit.archived) {
    if (habit.archivedAt && isDateKey(habit.archivedAt)) {
      if (dateKey >= habit.archivedAt) return false;
    } else {
      // Older archived records have no reliable archive date. Preserve only
      // explicitly recorded history instead of inventing scheduled misses.
      const hasRecordedHistory =
        habit.completedDates.includes(dateKey) ||
        (habit.progressEntries ?? []).some(entry => entry.dateKey === dateKey);
      if (!hasRecordedHistory) return false;
    }
  }
  if (
    habit.createdAt &&
    isDateKey(habit.createdAt) &&
    habit.createdAt > dateKey
  )
    return false;

  if (habit.endDate && isDateKey(habit.endDate) && dateKey > habit.endDate) {
    return false;
  }

  const habitType = normalizeHabitType(habit.habitType);
  const scheduleMode = normalizeScheduleMode(
    habit.scheduleMode,
    habit.frequency,
  );
  if (habitType === 'ONE_TIME' || scheduleMode === 'ONE_TIME') {
    return habit.targetDate === dateKey;
  }

  const day = fromDateKey(dateKey).getDay();
  if (scheduleMode === 'WEEKDAYS') return day !== 0 && day !== 6;
  if (scheduleMode === 'SPECIFIC_DAYS') {
    return normalizeWeekdays(habit.selectedWeekdays).includes(day);
  }
  return true;
}

export function getHabitProgressForDate(habit: HabitItem, dateKey: string) {
  return (habit.progressEntries ?? [])
    .filter(
      entry => entry.dateKey === dateKey && entry.actionType === 'PROGRESS',
    )
    .reduce((maximum, entry) => Math.max(maximum, entry.value), 0);
}

export function hasHabitRelapseOnDate(habit: HabitItem, dateKey: string) {
  return (habit.progressEntries ?? []).some(
    entry => entry.dateKey === dateKey && entry.actionType === 'RELAPSE',
  );
}

export function isHabitCompleteOnDate(habit: HabitItem, dateKey: string) {
  if (!isHabitApplicableToDate(habit, dateKey)) return false;
  if (normalizeHabitType(habit.habitType) === 'NEGATIVE') {
    return !hasHabitRelapseOnDate(habit, dateKey);
  }
  const goalMode = normalizeGoalMode(habit.goalMode);
  if (goalMode !== 'OFF' && habit.goalTarget) {
    return getHabitProgressForDate(habit, dateKey) >= habit.goalTarget;
  }
  return habit.completedDates.includes(dateKey);
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
      ? applicableHabits.filter(habit => isHabitCompleteOnDate(habit, dateKey))
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

export function getHabitTotalSuccesses(
  habit: HabitItem,
  endDateKey = toDateKey(new Date()),
) {
  const startKey = getRelevantStartDate([habit], endDateKey);
  const effectiveEnd =
    habit.endDate && isDateKey(habit.endDate) && habit.endDate < endDateKey
      ? habit.endDate
      : endDateKey;
  return getDateRange(startKey, effectiveEnd).filter(dateKey =>
    isHabitCompleteOnDate(habit, dateKey),
  ).length;
}

export function calculateHabitStreak(
  habit: HabitItem,
  endDateKey = toDateKey(new Date()),
) {
  const start = getRelevantStartDate([habit], endDateKey);
  let streak = 0;
  for (const date of getDateRange(start, endDateKey).reverse()) {
    if (!isHabitApplicableToDate(habit, date)) continue;
    if (!isHabitCompleteOnDate(habit, date)) break;
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
      (total, habit) => total + getHabitTotalSuccesses(habit, endDateKey),
      0,
    ),
    perfectDays,
    unlockedAchievements,
  };
}

export function calculateCurrentWeekMetrics(
  habits: HabitItem[],
  today = new Date(),
  weekStartsOn: WeekStartsOn = 0,
) {
  const todayKey = toDateKey(today);
  const metrics = calculateSelectedWeekMetrics(
    habits,
    todayKey,
    weekStartsOn,
    todayKey,
  );
  return {
    completed: metrics.achieved,
    applicable: metrics.target,
    percentage: metrics.percentage,
    perfectDays: metrics.days.filter(day => day.isPerfect).length,
  };
}

export type WeeklyProgressDay = {
  dateKey: string;
  achieved: number;
  target: number;
  completed: number;
  applicable: number;
  percentage: number;
  isPerfect: boolean;
  isFuture: boolean;
};

export type SelectedWeekMetrics = {
  startKey: string;
  endKey: string;
  days: WeeklyProgressDay[];
  achieved: number;
  target: number;
  completed: number;
  applicable: number;
  percentage: number;
};

function getDateContribution(habit: HabitItem, dateKey: string) {
  const goalMode = normalizeGoalMode(habit.goalMode);
  const target = goalMode === 'OFF' ? 1 : Math.max(1, habit.goalTarget ?? 1);
  const achieved =
    normalizeHabitType(habit.habitType) === 'NEGATIVE'
      ? isHabitCompleteOnDate(habit, dateKey)
        ? target
        : 0
      : goalMode === 'OFF'
      ? habit.completedDates.includes(dateKey)
        ? 1
        : 0
      : Math.min(target, getHabitProgressForDate(habit, dateKey));
  return { achieved, target };
}

export function calculateSelectedWeekMetrics(
  habits: HabitItem[],
  selectedDateKey: string,
  weekStartsOn: WeekStartsOn = 0,
  todayKey = toDateKey(new Date()),
): SelectedWeekMetrics {
  const dateKeys = getWeekDateKeys(selectedDateKey, weekStartsOn);
  const startKey = dateKeys[0] ?? selectedDateKey;
  const endKey = dateKeys[6] ?? selectedDateKey;
  const weeklyQuotaHabits = habits.filter(
    habit =>
      normalizeScheduleMode(habit.scheduleMode, habit.frequency) ===
        'WEEKLY_QUOTA',
  );
  const ordinaryHabits = habits.filter(habit => {
    const mode = normalizeScheduleMode(habit.scheduleMode, habit.frequency);
    return (
      mode !== 'WEEKLY_QUOTA' &&
      mode !== 'MONTHLY_QUOTA' &&
      mode !== 'YEARLY_QUOTA'
    );
  });

  const days = dateKeys.map<WeeklyProgressDay>(dateKey => {
    const isFuture = dateKey > todayKey;
    let achieved = 0;
    let target = 0;
    if (!isFuture) {
      ordinaryHabits.forEach(habit => {
        if (!isHabitApplicableToDate(habit, dateKey)) return;
        const contribution = getDateContribution(habit, dateKey);
        achieved += contribution.achieved;
        target += contribution.target;
      });

      // Quota targets belong to the whole week. Daily bars show only the
      // distinct dates on which quota progress was actually made.
      weeklyQuotaHabits.forEach(habit => {
        if (!isHabitApplicableToDate(habit, dateKey)) return;
        const contribution = getDateContribution(habit, dateKey);
        if (contribution.achieved > 0) {
          achieved += 1;
          target += 1;
        }
      });
    }
    return {
      dateKey,
      achieved,
      target,
      completed: achieved,
      applicable: target,
      percentage: target ? Math.round((achieved / target) * 100) : 0,
      isPerfect: target > 0 && achieved >= target,
      isFuture,
    };
  });

  let achieved = days.reduce((sum, day) => sum + day.achieved, 0);
  let target = days.reduce((sum, day) => sum + day.target, 0);
  weeklyQuotaHabits.forEach(habit => {
    const eligibleElapsedDays = dateKeys.filter(
      dateKey =>
        dateKey <= todayKey && isHabitApplicableToDate(habit, dateKey),
    ).length;
    if (!eligibleElapsedDays) return;
    const quotaTarget = Math.min(
      Math.max(1, Math.floor(habit.quotaCount ?? 1)),
      eligibleElapsedDays,
    );
    const quotaProgress = getHabitQuotaProgress(
      habit,
      selectedDateKey,
      weekStartsOn,
    );
    const dailyQuotaAchievements = days.reduce(
      (sum, day) =>
        sum +
        (isHabitApplicableToDate(habit, day.dateKey) &&
        !day.isFuture &&
        getDateContribution(habit, day.dateKey).achieved > 0
          ? 1
          : 0),
      0,
    );
    achieved += Math.min(quotaTarget, quotaProgress?.completed ?? 0) -
      dailyQuotaAchievements;
    target += quotaTarget - dailyQuotaAchievements;
  });
  achieved = Math.max(0, achieved);
  target = Math.max(0, target);

  return {
    startKey,
    endKey,
    days,
    achieved,
    target,
    completed: achieved,
    applicable: target,
    percentage: target ? Math.min(100, Math.round((achieved / target) * 100)) : 0,
  };
}

export function calculatePreviousWeekMetrics(
  habits: HabitItem[],
  today = new Date(),
) {
  const currentWeekStart = startOfWeek(today);
  const previousWeekStart = addDays(currentWeekStart, -7);
  const previousWeekEnd = addDays(previousWeekStart, 6);
  const startKey = toDateKey(previousWeekStart);
  const endKey = toDateKey(previousWeekEnd);
  const days = getDateRange(startKey, endKey).map(dateKey => ({
    dateKey,
    ...getDailyProgress(habits, dateKey, toDateKey(today)),
  }));
  const completed = days.reduce((sum, day) => sum + day.completed, 0);
  const applicable = days.reduce((sum, day) => sum + day.applicable, 0);

  return {
    startKey,
    endKey,
    days,
    completed,
    applicable,
    percentage: applicable ? Math.round((completed / applicable) * 100) : 0,
  };
}
