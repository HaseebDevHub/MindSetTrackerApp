import { ACHIEVEMENTS } from '../src/constants/achievements';
import { achievementStorage } from '../src/storage/achievementStorage';
import { completionStorage } from '../src/storage/completionStorage';
import { habitStorage } from '../src/storage/habitStorage';
import { storage } from '../src/storage/storage';
import {
  STORAGE_KEYS,
  type CompletionStorageKey,
} from '../src/storage/storageKeys';
import type { HabitItem, UserStats } from '../src/types/models';
import {
  calculateStats,
  getDailyProgress,
  isHabitApplicableToDate,
} from '../src/utils/habitAnalytics';

const weekdayHabit: HabitItem = {
  id: 'weekday',
  title: 'Study on weekdays',
  timeOfDay: 'MORNING',
  frequency: 'WEEKDAYS',
  createdAt: '2026-08-24',
  completedDates: ['2026-08-24', '2026-08-25', '2026-08-26'],
  streakCount: 0,
  iconName: 'BookOpen',
};

function resetDomainStorage() {
  completionStorage
    .getDates()
    .forEach(date =>
      storage.remove(`habits.completions.${date}` as CompletionStorageKey),
    );
  [
    STORAGE_KEYS.HABITS,
    STORAGE_KEYS.LEGACY_DEMO_HABITS_REMOVED,
    STORAGE_KEYS.COMPLETION_DATES,
    STORAGE_KEYS.ACHIEVEMENT_UNLOCKS,
    STORAGE_KEYS.CELEBRATED_PERFECT_DAYS,
  ].forEach(key => storage.remove(key));
}

describe('habit and completion persistence', () => {
  beforeEach(resetDomainStorage);
  afterAll(resetDomainStorage);

  test('stores habit metadata separately from date-specific completion records', () => {
    expect(habitStorage.setHabits([weekdayHabit])).toBe(true);
    weekdayHabit.completedDates.forEach(date =>
      expect(
        completionStorage.setHabitCompletion(weekdayHabit.id, date, true),
      ).toBe(true),
    );

    const stored = habitStorage.getHabits();
    expect(stored).toHaveLength(1);
    expect(stored?.[0]).not.toHaveProperty('completedDates');
    expect(stored?.[0]).not.toHaveProperty('streakCount');

    const hydrated = completionStorage.hydrateHabits(stored!);
    expect(hydrated[0].completedDates).toEqual(weekdayHabit.completedDates);
  });

  test('uses an empty collection when habit storage is missing or empty', () => {
    expect(habitStorage.hasStoredHabits()).toBe(false);
    expect(habitStorage.getHabits()).toEqual([]);

    expect(habitStorage.setHabits([])).toBe(true);
    expect(habitStorage.hasStoredHabits()).toBe(true);
    expect(habitStorage.getHabits()).toEqual([]);
  });

  test('removes only legacy seeded IDs and preserves user records and completions', () => {
    const userHabit: HabitItem = {
      ...weekdayHabit,
      id: 'habit-user-created',
      title: 'Drink 8 cups of water',
    };
    const legacySeed: HabitItem = {
      ...weekdayHabit,
      id: 'water',
      title: 'Legacy seeded record',
    };

    expect(habitStorage.setHabits([legacySeed, userHabit])).toBe(true);
    expect(
      completionStorage.setHabitCompletion(
        userHabit.id,
        '2026-08-25',
        true,
      ),
    ).toBe(true);
    expect(
      completionStorage.setHabitCompletion(
        legacySeed.id,
        '2026-08-25',
        true,
      ),
    ).toBe(true);

    expect(habitStorage.getHabits().map(habit => habit.id)).toEqual([
      userHabit.id,
    ]);
    expect(habitStorage.getHabits().map(habit => habit.id)).toEqual([
      userHabit.id,
    ]);
    expect(completionStorage.getCompletedHabitIds('2026-08-25')).toEqual([
      userHabit.id,
      legacySeed.id,
    ]);
  });

  test('updates only the selected habit and date idempotently', () => {
    completionStorage.setHabitCompletion('habit-a', '2026-08-25', true);
    completionStorage.setHabitCompletion('habit-a', '2026-08-25', true);
    completionStorage.setHabitCompletion('habit-b', '2026-08-25', true);
    completionStorage.setHabitCompletion('habit-a', '2026-08-26', true);

    expect(completionStorage.getCompletedHabitIds('2026-08-25')).toEqual([
      'habit-a',
      'habit-b',
    ]);
    expect(completionStorage.getCompletedHabitIds('2026-08-26')).toEqual([
      'habit-a',
    ]);

    completionStorage.setHabitCompletion('habit-a', '2026-08-25', false);
    expect(completionStorage.getCompletedHabitIds('2026-08-25')).toEqual([
      'habit-b',
    ]);
    expect(completionStorage.getCompletedHabitIds('2026-08-26')).toEqual([
      'habit-a',
    ]);
  });
});

describe('schedule-aware analytics', () => {
  test('excludes unscheduled weekdays habits on weekends', () => {
    expect(isHabitApplicableToDate(weekdayHabit, '2026-08-28')).toBe(true);
    expect(isHabitApplicableToDate(weekdayHabit, '2026-08-29')).toBe(false);
    expect(getDailyProgress([weekdayHabit], '2026-08-29')).toEqual({
      applicable: 0,
      completed: 0,
      percentage: 0,
      isPerfect: false,
    });
  });

  test('derives idempotent totals, perfect days, and streaks from records', () => {
    const stats = calculateStats([weekdayHabit], '2026-08-27');
    expect(stats).toMatchObject({
      habitsFinishedTotal: 3,
      perfectDays: 3,
      currentStreak: 0,
      bestStreak: 3,
    });

    const completedWeek: HabitItem = {
      ...weekdayHabit,
      completedDates: [
        '2026-08-24',
        '2026-08-25',
        '2026-08-26',
        '2026-08-27',
        '2026-08-28',
      ],
    };
    expect(calculateStats([completedWeek], '2026-08-30')).toMatchObject({
      currentStreak: 5,
      bestStreak: 5,
      perfectDays: 5,
      habitsFinishedTotal: 5,
    });
  });
});

describe('achievement persistence', () => {
  beforeEach(resetDomainStorage);
  afterAll(resetDomainStorage);

  test('unlocks each qualifying achievement only once', () => {
    const stats: UserStats = {
      currentStreak: 3,
      bestStreak: 3,
      habitsFinishedTotal: 10,
      perfectDays: 3,
      unlockedAchievements: [],
    };
    const first = achievementStorage.evaluate(stats, true);
    expect(first.newlyUnlocked.length).toBeGreaterThan(0);
    expect(new Set(first.unlocks.map(unlock => unlock.id)).size).toBe(
      first.unlocks.length,
    );
    expect(first.unlocks.map(unlock => unlock.id)).toEqual(
      expect.arrayContaining([
        'habits_finished_1',
        'habits_finished_10',
        'perfect_days_3',
        'streak_3',
      ]),
    );

    expect(achievementStorage.evaluate(stats, true).newlyUnlocked).toEqual([]);
    expect(achievementStorage.claimPerfectDay('2026-08-25')).toBe(true);
    expect(achievementStorage.claimPerfectDay('2026-08-25')).toBe(false);
    expect(ACHIEVEMENTS).toHaveLength(18);
  });
});
