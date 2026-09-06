import type { AchievementCategory, UserStats } from '../types/models';
import type { TranslationKey } from '../localization/languages/english';

export type AchievementDefinition = {
  id: string;
  category: AchievementCategory;
  threshold: number;
  title: string;
  titleKey: TranslationKey;
};

const categoryDefinitions = (
  category: AchievementCategory,
  metric: string,
  thresholds: number[],
  singularKey: TranslationKey,
  pluralKey: TranslationKey,
): AchievementDefinition[] =>
  thresholds.map(threshold => ({
    id: `${
      category === 'BEST_STREAK' ? 'streak' : category.toLowerCase()
    }_${threshold}`,
    category,
    threshold,
    title: `${threshold} ${metric}${threshold === 1 ? '' : 's'}`,
    titleKey: threshold === 1 ? singularKey : pluralKey,
  }));

export const ACHIEVEMENTS: AchievementDefinition[] = [
  ...categoryDefinitions(
    'HABITS_FINISHED',
    'Habit Finished',
    [1, 10, 20, 50, 100, 300],
    'history_achievement_habit_finished_one',
    'history_achievement_habit_finished_many',
  ),
  ...categoryDefinitions(
    'PERFECT_DAYS',
    'Perfect Day',
    [3, 10, 20, 30, 50, 100],
    'history_achievement_perfect_day_one',
    'history_achievement_perfect_day_many',
  ),
  ...categoryDefinitions(
    'BEST_STREAK',
    'Day Streak',
    [3, 5, 10, 15, 30, 90],
    'history_achievement_day_streak_one',
    'history_achievement_day_streak_many',
  ),
];

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  'HABITS_FINISHED',
  'PERFECT_DAYS',
  'BEST_STREAK',
];

export function achievementMetric(
  stats: UserStats,
  category: AchievementCategory,
) {
  if (category === 'HABITS_FINISHED') return stats.habitsFinishedTotal;
  if (category === 'PERFECT_DAYS') return stats.perfectDays;
  return stats.bestStreak;
}
