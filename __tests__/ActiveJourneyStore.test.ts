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
    expect(store.getState().activeJourneys.map(item => item.journeyId)).toEqual([
      'walk',
      'sleep',
    ]);
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
    expect(store.getState().activeJourneys.map(item => item.journeyId)).toEqual([
      'sleep',
    ]);

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
      store
        .getState()
        .toggleJourneyTask('walk-active', 'walk-ten-minutes'),
      store
        .getState()
        .toggleJourneyTask('walk-active', 'walk-ten-minutes'),
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
