import { createAppStore } from '../src/store/useAppStore';
import { onboardingStorage } from '../src/storage/onboardingStorage';
import { storage } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/storageKeys';
import type { HabitItem } from '../src/types/models';
import { InMemoryHabitRepository } from '../test-utils/InMemoryHabitRepository';

const today = new Date(2026, 7, 30, 12);
const habit: HabitItem = {
  id: 'habit-1',
  title: 'Drink water',
  timeOfDay: 'MORNING',
  frequency: 'EVERYDAY',
  iconName: 'Droplets',
  reminderEnabled: true,
  reminderTime: '08:00',
  archived: false,
  createdAt: '2026-08-20',
  completedDates: ['2026-08-28'],
  streakCount: 0,
};

function makeStore(repository: InMemoryHabitRepository, migrate = jest.fn()) {
  return createAppStore({
    repository,
    runLegacyMigration: async repo => migrate(repo),
    now: () => today,
  });
}

function resetPreferenceState() {
  onboardingStorage.resetOnboarding();
  [
    STORAGE_KEYS.ACHIEVEMENT_UNLOCKS,
    STORAGE_KEYS.CELEBRATED_PERFECT_DAYS,
    STORAGE_KEYS.WATERMELON_HABIT_MIGRATION_V1,
  ].forEach(key => storage.remove(key));
}

describe('async WatermelonDB store orchestration', () => {
  beforeEach(resetPreferenceState);
  afterAll(resetPreferenceState);

  test('hydrates canonical habits and completions from the repository', async () => {
    const repository = new InMemoryHabitRepository([habit]);
    const store = makeStore(repository);

    expect(store.getState().habits).toEqual([]);
    expect(await store.getState().initialize()).toBe(true);
    expect(store.getState()).toMatchObject({
      isHydrated: true,
      isHydrating: false,
      hydrationError: undefined,
    });
    expect(store.getState().habits[0]).toMatchObject({
      id: habit.id,
      completedDates: ['2026-08-28'],
    });
  });

  test('runs initialization once when startup calls overlap', async () => {
    const repository = new InMemoryHabitRepository([habit]);
    const migrate = jest.fn(async () => undefined);
    const store = makeStore(repository, migrate);

    await Promise.all([
      store.getState().initialize(),
      store.getState().initialize(),
    ]);
    expect(migrate).toHaveBeenCalledTimes(1);
  });

  test('exposes a recoverable hydration error instead of loading forever', async () => {
    const repository = new InMemoryHabitRepository();
    const store = createAppStore({
      repository,
      runLegacyMigration: async () => {
        throw new Error('database unavailable');
      },
      now: () => today,
    });

    expect(await store.getState().initialize()).toBe(false);
    expect(store.getState()).toMatchObject({
      isHydrated: false,
      isHydrating: false,
      hydrationError: expect.any(String),
    });
  });

  test('creates a habit in the database before updating Zustand', async () => {
    const repository = new InMemoryHabitRepository();
    const store = makeStore(repository);
    await store.getState().initialize();

    expect(
      await store.getState().addHabit({
        title: 'Read',
        timeOfDay: 'EVENING',
        iconName: 'BookOpen',
      }),
    ).toBe(true);
    expect(repository.createCalls).toBe(1);
    expect(store.getState().habits[0]).toMatchObject({
      id: 'generated-1',
      title: 'Read',
      completedDates: [],
      frequency: 'EVERYDAY',
      createdAt: '2026-08-30',
    });
  });

  test('updates and archives the database before changing Zustand', async () => {
    const repository = new InMemoryHabitRepository([habit]);
    const store = makeStore(repository);
    await store.getState().initialize();

    expect(
      await store.getState().updateHabit(habit.id, {
        title: 'Drink more water',
        reminderTime: '09:00',
      }),
    ).toBe(true);
    expect(await store.getState().setHabitArchived(habit.id, true)).toBe(true);
    expect(store.getState().habits[0]).toMatchObject({
      title: 'Drink more water',
      reminderTime: '09:00',
      archived: true,
    });
    expect((await repository.loadAllHabits())[0].archived).toBe(true);
  });

  test('inserts and removes exactly one completion row', async () => {
    const incomplete = { ...habit, completedDates: [] };
    const repository = new InMemoryHabitRepository([incomplete]);
    const store = makeStore(repository);
    await store.getState().initialize();

    expect(await store.getState().toggleHabit(habit.id, '2026-08-28')).toBe(
      true,
    );
    expect(repository.completionRowCount(habit.id, '2026-08-28')).toBe(1);
    expect(store.getState().habits[0].completedDates).toContain('2026-08-28');

    expect(await store.getState().toggleHabit(habit.id, '2026-08-28')).toBe(
      true,
    );
    expect(repository.completionRowCount(habit.id, '2026-08-28')).toBe(0);
    expect(store.getState().habits[0].completedDates).not.toContain(
      '2026-08-28',
    );
  });

  test('serializes rapid conflicting completion toggles', async () => {
    const repository = new InMemoryHabitRepository([
      { ...habit, completedDates: [] },
    ]);
    const store = makeStore(repository);
    await store.getState().initialize();

    await Promise.all([
      store.getState().toggleHabit(habit.id, '2026-08-28'),
      store.getState().toggleHabit(habit.id, '2026-08-28'),
    ]);

    expect(repository.completionCalls).toBe(2);
    expect(repository.completionRowCount(habit.id, '2026-08-28')).toBe(0);
    expect(store.getState().habits[0].completedDates).toEqual([]);
  });

  test('rejects future dates without writing to the repository', async () => {
    const repository = new InMemoryHabitRepository([habit]);
    const store = makeStore(repository);
    await store.getState().initialize();

    expect(await store.getState().toggleHabit(habit.id, '2026-08-31')).toBe(
      false,
    );
    expect(repository.completionCalls).toBe(0);
  });

  test('persistence failure does not leave false Zustand state', async () => {
    const repository = new InMemoryHabitRepository([habit]);
    const store = makeStore(repository);
    await store.getState().initialize();
    repository.failUpdate = true;

    expect(
      await store.getState().updateHabit(habit.id, { title: 'Not persisted' }),
    ).toBe(false);
    expect(store.getState().habits[0].title).toBe(habit.title);

    repository.failCreate = true;
    expect(
      await store.getState().addHabit({
        title: 'Also not persisted',
        timeOfDay: 'ANYTIME',
        iconName: 'Check',
      }),
    ).toBe(false);
    expect(store.getState().habits).toHaveLength(1);
  });

  test('a completion failure does not change Zustand completion state', async () => {
    const repository = new InMemoryHabitRepository([
      { ...habit, completedDates: [] },
    ]);
    const store = makeStore(repository);
    await store.getState().initialize();
    repository.failCompletion = true;

    expect(await store.getState().toggleHabit(habit.id, '2026-08-28')).toBe(
      false,
    );
    expect(store.getState().habits[0].completedDates).toEqual([]);
    expect(repository.completionRowCount(habit.id, '2026-08-28')).toBe(0);
  });

  test('finishes onboarding only after creating its first habit exactly once', async () => {
    onboardingStorage.setWakeUpTime('07:00');
    onboardingStorage.setDayEndTime('22:00');
    onboardingStorage.setTargets(['Live healthier']);
    onboardingStorage.setFirstHabit({
      ...habit,
      id: 'onboarding-habit-1',
      title: 'Morning water',
      completedDates: [],
    });
    const repository = new InMemoryHabitRepository();
    const store = makeStore(repository);
    await store.getState().initialize();

    const results = await Promise.all([
      store.getState().finishOnboarding(),
      store.getState().finishOnboarding(),
    ]);
    expect(results).toEqual([true, true]);
    expect(repository.onboardingCalls).toBe(1);
    expect(await repository.loadAllHabits()).toHaveLength(1);
    expect(onboardingStorage.isCompleted()).toBe(true);
    expect(store.getState().onboardingComplete).toBe(true);
  });

  test('does not complete onboarding when its WatermelonDB write fails', async () => {
    onboardingStorage.setWakeUpTime('07:00');
    onboardingStorage.setDayEndTime('22:00');
    onboardingStorage.setTargets(['Live healthier']);
    onboardingStorage.setFirstHabit({
      ...habit,
      id: 'onboarding-habit-failure',
      completedDates: [],
    });
    const repository = new InMemoryHabitRepository();
    repository.failOnboarding = true;
    const store = makeStore(repository);
    await store.getState().initialize();

    expect(await store.getState().finishOnboarding()).toBe(false);
    expect(onboardingStorage.isCompleted()).toBe(false);
    expect(store.getState().onboardingComplete).toBe(false);
    expect(await repository.loadAllHabits()).toEqual([]);
  });
});
