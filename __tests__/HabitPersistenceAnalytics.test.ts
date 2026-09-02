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
  calculatePreviousWeekMetrics,
  calculateSelectedWeekMetrics,
  calculateStats,
  getDailyProgress,
  getHabitQuotaProgress,
  hasHabitRelapseOnDate,
  isHabitApplicableToDate,
  isHabitCompleteOnDate,
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
    storage.setString(
      STORAGE_KEYS.COMPLETION_DATES,
      JSON.stringify(['2026-08-25']),
    );
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

  test('calculates the previous completed Sunday-to-Saturday week', () => {
    const everydayHabit: HabitItem = {
      ...weekdayHabit,
      id: 'everyday',
      frequency: 'EVERYDAY',
      createdAt: '2026-08-23',
      completedDates: ['2026-08-23', '2026-08-24', '2026-08-25', '2026-08-29'],
    };
    const metrics = calculatePreviousWeekMetrics(
      [everydayHabit, weekdayHabit],
      new Date(2026, 7, 30, 12),
    );

    expect(metrics).toMatchObject({
      startKey: '2026-08-23',
      endKey: '2026-08-29',
      completed: 7,
      applicable: 12,
      percentage: 58,
    });
    expect(metrics.days).toHaveLength(7);
    expect(metrics.days[0]).toMatchObject({
      dateKey: '2026-08-23',
      completed: 1,
      applicable: 1,
      percentage: 100,
    });
    expect(metrics.days[6]).toMatchObject({
      dateKey: '2026-08-29',
      completed: 1,
      applicable: 1,
      percentage: 100,
    });
  });

  test('calculates the selected week and excludes future scheduled work', () => {
    const everyday: HabitItem = {
      ...weekdayHabit,
      id: 'selected-week-everyday',
      frequency: 'EVERYDAY',
      scheduleMode: 'EVERYDAY',
      createdAt: '2026-08-30',
      completedDates: ['2026-08-30', '2026-09-01', '2026-09-04'],
    };
    const metrics = calculateSelectedWeekMetrics(
      [everyday],
      '2026-09-01',
      0,
      '2026-09-02',
    );

    expect(metrics).toMatchObject({
      startKey: '2026-08-30',
      endKey: '2026-09-05',
      achieved: 2,
      target: 4,
      percentage: 50,
    });
    expect(metrics.days.slice(4).every(day => day.isFuture)).toBe(true);
    expect(metrics.days.slice(4).every(day => day.target === 0)).toBe(true);
  });

  test('counts goal progress and a weekly quota once per selected week', () => {
    const duration: HabitItem = {
      ...weekdayHabit,
      id: 'duration',
      frequency: 'EVERYDAY',
      scheduleMode: 'EVERYDAY',
      goalMode: 'DURATION',
      goalTarget: 10,
      createdAt: '2026-08-31',
      completedDates: [],
      progressEntries: [
        { dateKey: '2026-08-31', actionType: 'PROGRESS', value: 5 },
        { dateKey: '2026-09-01', actionType: 'PROGRESS', value: 10 },
      ],
    };
    const weeklyQuota: HabitItem = {
      ...weekdayHabit,
      id: 'weekly-quota',
      frequency: 'EVERYDAY',
      scheduleMode: 'WEEKLY_QUOTA',
      quotaCount: 3,
      createdAt: '2026-08-31',
      completedDates: ['2026-08-31', '2026-09-02'],
    };
    const longTerm: HabitItem = {
      ...weekdayHabit,
      id: 'monthly-quota',
      frequency: 'EVERYDAY',
      scheduleMode: 'MONTHLY_QUOTA',
      quotaCount: 10,
      createdAt: '2026-08-01',
      completedDates: ['2026-09-01'],
    };

    const metrics = calculateSelectedWeekMetrics(
      [duration, weeklyQuota, longTerm],
      '2026-09-01',
      1,
      '2026-09-02',
    );

    expect(metrics).toMatchObject({
      startKey: '2026-08-31',
      endKey: '2026-09-06',
      achieved: 17,
      target: 33,
      percentage: 52,
    });
  });

  test('handles fixed weekdays, negative habits, and one-time target dates', () => {
    const fixed: HabitItem = {
      ...weekdayHabit,
      id: 'fixed',
      scheduleMode: 'SPECIFIC_DAYS',
      selectedWeekdays: [1, 3],
      createdAt: '2026-08-30',
      completedDates: ['2026-08-31'],
    };
    const negative: HabitItem = {
      ...weekdayHabit,
      id: 'negative',
      habitType: 'NEGATIVE',
      scheduleMode: 'EVERYDAY',
      frequency: 'EVERYDAY',
      createdAt: '2026-09-01',
      completedDates: [],
      progressEntries: [
        { dateKey: '2026-09-02', actionType: 'RELAPSE', value: 1 },
      ],
    };
    const oneTime: HabitItem = {
      ...weekdayHabit,
      id: 'one-time',
      habitType: 'ONE_TIME',
      scheduleMode: 'ONE_TIME',
      targetDate: '2026-09-02',
      createdAt: '2026-08-30',
      completedDates: ['2026-09-02'],
    };

    const metrics = calculateSelectedWeekMetrics(
      [fixed, negative, oneTime],
      '2026-09-01',
      1,
      '2026-09-02',
    );

    expect(metrics).toMatchObject({ achieved: 3, target: 5, percentage: 60 });
    expect(metrics.days[0]).toMatchObject({ achieved: 1, target: 1 });
    expect(metrics.days[2]).toMatchObject({ achieved: 1, target: 3 });
  });

  test('keeps pre-archive dates in History without scheduling later dates', () => {
    const archived: HabitItem = {
      ...weekdayHabit,
      id: 'archived-history',
      frequency: 'EVERYDAY',
      scheduleMode: 'EVERYDAY',
      createdAt: '2026-08-30',
      archived: true,
      archivedAt: '2026-09-02',
      completedDates: ['2026-08-30', '2026-09-01'],
    };

    const metrics = calculateSelectedWeekMetrics(
      [archived],
      '2026-09-01',
      0,
      '2026-09-05',
    );

    expect(metrics).toMatchObject({ achieved: 2, target: 3, percentage: 67 });
    expect(isHabitApplicableToDate(archived, '2026-09-01')).toBe(true);
    expect(isHabitApplicableToDate(archived, '2026-09-02')).toBe(false);
  });

  test('preserves explicit legacy history when archive timing is unavailable', () => {
    const legacyArchived: HabitItem = {
      ...weekdayHabit,
      id: 'legacy-archived-history',
      frequency: 'EVERYDAY',
      scheduleMode: 'EVERYDAY',
      archived: true,
      archivedAt: undefined,
      completedDates: ['2026-09-01'],
    };

    expect(isHabitApplicableToDate(legacyArchived, '2026-09-01')).toBe(true);
    expect(isHabitCompleteOnDate(legacyArchived, '2026-09-01')).toBe(true);
    expect(isHabitApplicableToDate(legacyArchived, '2026-09-02')).toBe(false);
  });

  test('supports exact weekdays, end dates, and one-time target dates', () => {
    const specific: HabitItem = {
      ...weekdayHabit,
      scheduleMode: 'SPECIFIC_DAYS',
      selectedWeekdays: [1, 3],
      endDate: '2026-08-26',
    };
    expect(isHabitApplicableToDate(specific, '2026-08-24')).toBe(true);
    expect(isHabitApplicableToDate(specific, '2026-08-25')).toBe(false);
    expect(isHabitApplicableToDate(specific, '2026-08-31')).toBe(false);

    const oneTime: HabitItem = {
      ...weekdayHabit,
      habitType: 'ONE_TIME',
      scheduleMode: 'ONE_TIME',
      targetDate: '2026-09-03',
    };
    expect(isHabitApplicableToDate(oneTime, '2026-09-02')).toBe(false);
    expect(isHabitApplicableToDate(oneTime, '2026-09-03')).toBe(true);
    expect(isHabitApplicableToDate(oneTime, '2026-09-04')).toBe(false);
  });

  test('derives negative success only within its active date range', () => {
    const negative: HabitItem = {
      ...weekdayHabit,
      habitType: 'NEGATIVE',
      scheduleMode: 'EVERYDAY',
      frequency: 'EVERYDAY',
      createdAt: '2026-08-25',
      endDate: '2026-08-27',
      completedDates: [],
      progressEntries: [
        { dateKey: '2026-08-26', actionType: 'RELAPSE', value: 1 },
      ],
    };
    expect(isHabitCompleteOnDate(negative, '2026-08-24')).toBe(false);
    expect(isHabitCompleteOnDate(negative, '2026-08-25')).toBe(true);
    expect(hasHabitRelapseOnDate(negative, '2026-08-26')).toBe(true);
    expect(isHabitCompleteOnDate(negative, '2026-08-26')).toBe(false);
    expect(isHabitCompleteOnDate(negative, '2026-08-28')).toBe(false);
  });

  test('counts distinct quota completion days in the selected local period', () => {
    const monthly: HabitItem = {
      ...weekdayHabit,
      scheduleMode: 'MONTHLY_QUOTA',
      quotaCount: 3,
      frequency: 'EVERYDAY',
      createdAt: '2026-01-01',
      completedDates: [
        '2026-07-31',
        '2026-08-01',
        '2026-08-01',
        '2026-08-30',
        '2026-09-01',
      ],
    };
    expect(getHabitQuotaProgress(monthly, '2026-08-15')).toMatchObject({
      completed: 2,
      target: 3,
      percentage: 67,
      periodLabel: 'month',
      startKey: '2026-08-01',
      endKey: '2026-08-31',
    });
    expect(getHabitQuotaProgress(monthly, '2026-09-01')).toMatchObject({
      completed: 1,
      target: 3,
      percentage: 33,
      periodLabel: 'month',
    });

    const yearly = {
      ...monthly,
      scheduleMode: 'YEARLY_QUOTA' as const,
      quotaCount: 2,
      completedDates: ['2024-02-29', '2024-12-31', '2025-01-01'],
      createdAt: '2024-01-01',
    };
    expect(getHabitQuotaProgress(yearly, '2024-06-01')).toMatchObject({
      completed: 2,
      target: 2,
      percentage: 100,
      endKey: '2024-12-31',
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
