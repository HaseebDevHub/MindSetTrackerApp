import { createAppStore } from '../src/store/useAppStore';
import type { ActiveJourneyItem } from '../src/types/models';
import { InMemoryHabitRepository } from '../test-utils/InMemoryHabitRepository';
import { InMemoryJourneyRepository } from '../test-utils/InMemoryJourneyRepository';

const today = new Date(2026, 8, 4, 12);

function makeStore(repository: InMemoryJourneyRepository) {
  return createAppStore({
    repository: new InMemoryHabitRepository(),
    journeyRepository: repository,
    runLegacyMigration: async () => undefined,
    now: () => today,
  });
}

function active(
  id: string,
  journeyId: ActiveJourneyItem['journeyId'],
): ActiveJourneyItem {
  return {
    id,
    journeyId,
    startedDateKey: '2026-09-04',
    isActive: true,
    taskCompletions: [],
  };
}

describe('active journey store orchestration', () => {
  test('hydrates multiple simultaneous journeys', async () => {
    const repository = new InMemoryJourneyRepository([
      active('walk-active', 'walk'),
      active('sleep-active', 'sleep'),
    ]);
    const store = makeStore(repository);
    expect(await store.getState().initialize()).toBe(true);
    expect(store.getState().activeJourneys.map(item => item.journeyId)).toEqual(
      ['walk', 'sleep'],
    );
  });

  test('repeated Start calls reuse one enrollment', async () => {
    const repository = new InMemoryJourneyRepository();
    const store = makeStore(repository);
    await store.getState().initialize();
    const [first, second] = await Promise.all([
      store.getState().startJourney('walk'),
      store.getState().startJourney('walk'),
    ]);
    expect(first?.id).toBe(second?.id);
    expect(store.getState().activeJourneys).toHaveLength(1);
  });

  test('archives only the selected journey and resumes retained progress', async () => {
    const walk = active('walk-active', 'walk');
    walk.taskCompletions = [
      { taskId: 'walk-ten-minutes', dateKey: '2026-09-04' },
    ];
    const repository = new InMemoryJourneyRepository([
      walk,
      active('sleep-active', 'sleep'),
    ]);
    const store = makeStore(repository);
    await store.getState().initialize();

    expect(await store.getState().removeActiveJourney(walk.id)).toBe(true);
    expect(store.getState().activeJourneys.map(item => item.journeyId)).toEqual(
      ['sleep'],
    );

    const resumed = await store.getState().startJourney('walk');
    expect(resumed).toMatchObject({
      id: walk.id,
      taskCompletions: walk.taskCompletions,
    });
  });

  test('serializes rapid task toggles without duplicate completions', async () => {
    const repository = new InMemoryJourneyRepository([
      active('walk-active', 'walk'),
    ]);
    const store = makeStore(repository);
    await store.getState().initialize();
    await Promise.all([
      store.getState().toggleJourneyTask('walk-active', 'walk-ten-minutes'),
      store.getState().toggleJourneyTask('walk-active', 'walk-ten-minutes'),
    ]);
    expect(repository.toggleCalls).toBe(2);
    expect(store.getState().activeJourneys[0].taskCompletions).toEqual([]);
  });

  test('database failures do not create false Zustand state', async () => {
    const repository = new InMemoryJourneyRepository([
      active('walk-active', 'walk'),
    ]);
    const store = makeStore(repository);
    await store.getState().initialize();
    repository.failToggle = true;
    expect(
      await store
        .getState()
        .toggleJourneyTask('walk-active', 'walk-ten-minutes'),
    ).toBe(false);
    expect(store.getState().activeJourneys[0].taskCompletions).toEqual([]);

    repository.failRemove = true;
    expect(await store.getState().removeActiveJourney('walk-active')).toBe(
      false,
    );
    expect(store.getState().activeJourneys).toHaveLength(1);
  });
});

describe('progressive enrollment persistence', () => {
  test('starts on the local date, restores version and independent daily progress', async () => {
    let now = new Date(2026, 8, 27, 23, 55);
    const repository = new InMemoryJourneyRepository();
    const dependencies = {
      repository: new InMemoryHabitRepository(),
      journeyRepository: repository,
      runLegacyMigration: async () => undefined,
      now: () => now,
    };
    const store = createAppStore(dependencies);
    await store.getState().initialize();
    const started = (await store.getState().startJourney('morning'))!;
    expect(started).toMatchObject({
      startedDateKey: '2026-09-27',
      planVersion: 1,
    });
    expect(
      await store.getState().toggleJourneyTask(started.id, 'morning-breakfast'),
    ).toBe(false);
    expect(
      await store
        .getState()
        .toggleJourneyTask(started.id, 'morning-drink-water', '2026-09-27'),
    ).toBe(true);
    now = new Date(2026, 8, 28, 0, 5);
    expect(
      await store
        .getState()
        .toggleJourneyTask(started.id, 'morning-drink-water', '2026-09-27'),
    ).toBe(false);
    expect(
      await store
        .getState()
        .toggleJourneyTask(started.id, 'morning-drink-water', '2026-09-29'),
    ).toBe(false);
    expect(
      await store
        .getState()
        .toggleJourneyTask(started.id, 'morning-drink-water'),
    ).toBe(true);
    const restored = createAppStore(dependencies);
    await restored.getState().initialize();
    expect(restored.getState().activeJourneys[0]).toMatchObject({
      id: started.id,
      startedDateKey: '2026-09-27',
      planVersion: 1,
      taskCompletions: [
        { taskId: 'morning-drink-water', dateKey: '2026-09-27' },
        { taskId: 'morning-drink-water', dateKey: '2026-09-28' },
      ],
    });
    expect(
      await restored
        .getState()
        .toggleJourneyTask(started.id, 'morning-drink-water'),
    ).toBe(true);
    expect(restored.getState().activeJourneys[0].taskCompletions).toEqual([
      { taskId: 'morning-drink-water', dateKey: '2026-09-27' },
    ]);
    now = new Date(2026, 9, 18, 12);
    expect(
      await restored
        .getState()
        .toggleJourneyTask(started.id, 'morning-drink-water'),
    ).toBe(false);
  });

  test('refuses writes for removed, not-yet-started and unknown tasks', async () => {
    const item = {
      ...active('future', 'walk'),
      startedDateKey: '2026-09-05',
      planVersion: 1,
    };
    const repository = new InMemoryJourneyRepository([item]);
    const store = makeStore(repository);
    await store.getState().initialize();
    expect(
      await store.getState().toggleJourneyTask(item.id, 'walk-ten-minutes'),
    ).toBe(false);
    expect(await store.getState().toggleJourneyTask(item.id, 'unknown')).toBe(
      false,
    );
    await store.getState().removeActiveJourney(item.id);
    expect(
      await store.getState().toggleJourneyTask(item.id, 'walk-ten-minutes'),
    ).toBe(false);
    expect(repository.toggleCalls).toBe(0);
  });
});
