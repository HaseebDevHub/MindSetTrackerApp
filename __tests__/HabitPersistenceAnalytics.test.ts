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
import { addDays, toDateKey } from '../src/utils/dates';
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

function storedHabit(habit: HabitItem) {
  const stored: Partial<HabitItem> = { ...habit };
  delete stored.completedDates;
  delete stored.streakCount;
  return stored;
}

function seedLegacyCompletions(date: string, habitIds: string[]) {
  storage.setString(
    `habits.completions.${date}` as CompletionStorageKey,
    JSON.stringify(habitIds),
  );
}

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
    STORAGE_KEYS.WATERMELON_HABIT_MIGRATION_V1,
    STORAGE_KEYS.ACHIEVEMENT_UNLOCKS,
    STORAGE_KEYS.CELEBRATED_PERFECT_DAYS,
  ].forEach(key => storage.remove(key));
}

describe('read-only legacy habit and completion recovery', () => {
  beforeEach(resetDomainStorage);
  afterAll(resetDomainStorage);

  test('reads habit metadata and hydrates date-specific completion records', () => {
    storage.setString(
      STORAGE_KEYS.HABITS,
      JSON.stringify([storedHabit(weekdayHabit)]),
    );
    storage.setString(
      STORAGE_KEYS.COMPLETION_DATES,
      JSON.stringify(weekdayHabit.completedDates),
    );
    weekdayHabit.completedDates.forEach(date =>
      seedLegacyCompletions(date, [weekdayHabit.id, weekdayHabit.id]),
    );

    const stored = habitStorage.getHabits();
    expect(stored).toHaveLength(1);
    expect(stored[0]).not.toHaveProperty('completedDates');
    expect(stored[0]).not.toHaveProperty('streakCount');
    expect(completionStorage.hydrateHabits(stored)[0].completedDates).toEqual(
      weekdayHabit.completedDates,
    );
  });

  test('preserves valid records when another legacy record is malformed', () => {
    storage.setString(
      STORAGE_KEYS.HABITS,
      JSON.stringify([storedHabit(weekdayHabit), { id: 'broken', title: 42 }]),
    );
    expect(habitStorage.getHabits().map(habit => habit.id)).toEqual([
      weekdayHabit.id,
    ]);
  });

  test('deduplicates legacy IDs without using the habit title as identity', () => {
    const sameTitleDifferentId = {
      ...weekdayHabit,
      id: 'weekday-2',
    };
    storage.setString(
      STORAGE_KEYS.HABITS,
      JSON.stringify([
        storedHabit(weekdayHabit),
        storedHabit({ ...weekdayHabit, title: 'Duplicate ID ignored' }),
        storedHabit(sameTitleDifferentId),
      ]),
    );

    expect(habitStorage.getHabits().map(habit => habit.id)).toEqual([
      'weekday',
      'weekday-2',
    ]);
  });

  test('filters old demo records without deleting the MMKV recovery backup', () => {
    const demo = { ...weekdayHabit, id: 'water', title: 'Old demo' };
    storage.setString(
      STORAGE_KEYS.HABITS,
      JSON.stringify([storedHabit(demo), storedHabit(weekdayHabit)]),
    );
    const rawBefore = storage.getString(STORAGE_KEYS.HABITS);

    expect(habitStorage.getHabits().map(habit => habit.id)).toEqual([
      weekdayHabit.id,
    ]);
    expect(storage.getString(STORAGE_KEYS.HABITS)).toBe(rawBefore);
  });

  test('preserves post-cleanup records even when they reuse an old demo id', () => {
    const retained = { ...weekdayHabit, id: 'water', title: 'My water habit' };
    storage.setBoolean(STORAGE_KEYS.LEGACY_DEMO_HABITS_REMOVED, true);
    storage.setString(
      STORAGE_KEYS.HABITS,
      JSON.stringify([storedHabit(retained)]),
    );

    expect(habitStorage.getHabits()).toEqual([storedHabit(retained)]);
  });

  test('keeps valid completion ids when a legacy completion array is partly malformed', () => {
    storage.setString(STORAGE_KEYS.COMPLETION_DATES, JSON.stringify(['2026-08-25']));
    storage.setString(
      'habits.completions.2026-08-25',
      JSON.stringify([weekdayHabit.id, 42, weekdayHabit.id]),
    );

    expect(completionStorage.getCompletedHabitIds('2026-08-25')).toEqual([
      weekdayHabit.id,
    ]);
  });

  test('exposes no normal-runtime MMKV habit or completion writer', () => {
    expect(habitStorage).not.toHaveProperty('setHabits');
    expect(completionStorage).not.toHaveProperty('setHabitCompletion');
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

  test('ignores a future completion record in default daily progress', () => {
    const futureDate = toDateKey(addDays(new Date(), 1));
    const futureCompletedHabit: HabitItem = {
      ...weekdayHabit,
      frequency: 'EVERYDAY',
      createdAt: toDateKey(new Date()),
      completedDates: [futureDate],
    };

    expect(getDailyProgress([futureCompletedHabit], futureDate)).toEqual({
      applicable: 1,
      completed: 0,
      percentage: 0,
      isPerfect: false,
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
