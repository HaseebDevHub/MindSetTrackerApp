import { migrateLegacyHabitData } from '../src/database/migrateLegacyHabitData';
import type { HabitItem } from '../src/types/models';
import { InMemoryHabitRepository } from '../test-utils/InMemoryHabitRepository';

const legacyHabit: HabitItem = {
  id: 'legacy-habit-1',
  title: 'Read before bed',
  timeOfDay: 'EVENING',
  frequency: 'WEEKDAYS',
  iconName: 'BookOpen',
  note: 'Start with ten pages',
  reminderEnabled: true,
  reminderTime: '21:30',
  archived: true,
  createdAt: '2026-08-20',
  completedDates: ['2026-08-20', '2026-08-20', '2026-08-21', 'not-a-date'],
  streakCount: 99,
};

function metadataOf(habits: HabitItem[]) {
  return habits.map(
    ({ completedDates: _dates, streakCount: _streak, ...habit }) => habit,
  );
}

function migrationDependencies(
  repository: InMemoryHabitRepository,
  habits: HabitItem[],
  marker: { value: boolean },
) {
  return {
    repository,
    getLegacyHabits: () => metadataOf(habits),
    hydrateLegacyHabits: () => habits,
    getOnboardingHabit: () => undefined,
    isOnboardingCompleted: () => false,
    getMarker: () => marker.value,
    setMarker: () => {
      marker.value = true;
      return true;
    },
    todayKey: '2026-08-30',
  };
}

describe('MMKV to WatermelonDB habit migration', () => {
  test('completes a fresh installation with no legacy habits', async () => {
    const repository = new InMemoryHabitRepository();
    const marker = { value: false };

    await expect(
      migrateLegacyHabitData(migrationDependencies(repository, [], marker)),
    ).resolves.toBe('no-legacy-data');
    expect(marker.value).toBe(true);
    expect(await repository.loadAllHabits()).toEqual([]);
  });

  test('preserves every habit field and all valid completion dates', async () => {
    const repository = new InMemoryHabitRepository();
    const marker = { value: false };

    await expect(
      migrateLegacyHabitData(
        migrationDependencies(repository, [legacyHabit], marker),
      ),
    ).resolves.toBe('imported');

    expect(await repository.loadAllHabits()).toEqual([
      {
        ...legacyHabit,
        completedDates: ['2026-08-20', '2026-08-21'],
        streakCount: 0,
      },
    ]);
    expect(marker.value).toBe(true);
  });

  test('deduplicates duplicate IDs and completion dates', async () => {
    const repository = new InMemoryHabitRepository();
    const marker = { value: false };

    await migrateLegacyHabitData(
      migrationDependencies(
        repository,
        [legacyHabit, { ...legacyHabit, title: 'Duplicate ID' }],
        marker,
      ),
    );

    expect(await repository.loadAllHabits()).toHaveLength(1);
    expect(repository.completionRowCount('legacy-habit-1', '2026-08-20')).toBe(
      1,
    );
  });

  test('is idempotent after a completed import', async () => {
    const repository = new InMemoryHabitRepository();
    const marker = { value: false };
    const dependencies = migrationDependencies(
      repository,
      [legacyHabit],
      marker,
    );

    await migrateLegacyHabitData(dependencies);
    await expect(migrateLegacyHabitData(dependencies)).resolves.toBe(
      'already-complete',
    );
    expect(repository.importCalls).toBe(1);
    expect(await repository.loadAllHabits()).toHaveLength(1);
  });

  test('does not set the marker when the atomic import fails', async () => {
    const repository = new InMemoryHabitRepository();
    repository.failImport = true;
    const marker = { value: false };

    await expect(
      migrateLegacyHabitData(
        migrationDependencies(repository, [legacyHabit], marker),
      ),
    ).rejects.toThrow('import failed');
    expect(marker.value).toBe(false);
    expect(await repository.loadAllHabits()).toEqual([]);
  });

  test('an existing marker skips a verified completed import', async () => {
    const repository = new InMemoryHabitRepository([
      { ...legacyHabit, completedDates: ['2026-08-20', '2026-08-21'] },
    ]);
    const marker = { value: true };

    await expect(
      migrateLegacyHabitData(
        migrationDependencies(repository, [legacyHabit], marker),
      ),
    ).resolves.toBe('already-complete');
    expect(repository.importCalls).toBe(0);
  });

  test('recovers when the marker exists but the database is empty', async () => {
    const repository = new InMemoryHabitRepository();
    const marker = { value: true };

    await expect(
      migrateLegacyHabitData(
        migrationDependencies(repository, [legacyHabit], marker),
      ),
    ).resolves.toBe('recovered');
    expect(await repository.loadAllHabits()).toHaveLength(1);
  });

  test('recovers missing completions even when the habit row exists', async () => {
    const repository = new InMemoryHabitRepository([
      { ...legacyHabit, completedDates: [] },
    ]);
    const marker = { value: true };

    await expect(
      migrateLegacyHabitData(
        migrationDependencies(repository, [legacyHabit], marker),
      ),
    ).resolves.toBe('recovered');
    expect((await repository.loadAllHabits())[0].completedDates).toEqual([
      '2026-08-20',
      '2026-08-21',
    ]);
  });

  test('does not mark success when writing the marker fails', async () => {
    const repository = new InMemoryHabitRepository();

    await expect(
      migrateLegacyHabitData({
        ...migrationDependencies(repository, [legacyHabit], { value: false }),
        setMarker: () => false,
      }),
    ).rejects.toThrow('Could not record completion');
  });
});
