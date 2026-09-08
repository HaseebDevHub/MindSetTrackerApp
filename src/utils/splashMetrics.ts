import type { HabitItem, WeekStartsOn } from '../types/models';
import { getWeekDateKeys, toDateKey } from './dates';
import { getDailyProgress, getDateRange } from './habitAnalytics';

export function getSplashMetrics(
  habits: HabitItem[],
  startedDateKey: string,
  today = new Date(),
  weekStartsOn: WeekStartsOn = 0,
) {
  const todayKey = toDateKey(today);
  const appDay = Math.max(1, getDateRange(startedDateKey, todayKey).length);
  const completedThisWeek = getWeekDateKeys(todayKey, weekStartsOn).reduce(
    (total, dateKey) =>
      dateKey <= todayKey
        ? total + getDailyProgress(habits, dateKey, todayKey).completed
        : total,
    0,
  );

  return { appDay, completedThisWeek };
}
