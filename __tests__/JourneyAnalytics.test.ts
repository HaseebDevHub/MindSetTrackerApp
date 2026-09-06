import { journeys } from '../src/data/mockData';
import type { ActiveJourneyItem } from '../src/types/models';
import {
  getJourneyFinalDateKey,
  getJourneyMetrics,
} from '../src/utils/journeyAnalytics';

const journey = journeys[0];

function enrollment(
  taskCompletions: ActiveJourneyItem['taskCompletions'] = [],
): ActiveJourneyItem {
  return {
    id: 'active-walk',
    journeyId: journey.id,
    startedDateKey: '2026-03-07',
    isActive: true,
    taskCompletions,
  };
}

const completeDay = (dateKey: string) =>
  journey.habits.map(task => ({ taskId: task.id, dateKey }));

describe('journey progress calculations', () => {
  test('uses local date keys across a DST boundary', () => {
    const metrics = getJourneyMetrics(enrollment(), journey, '2026-03-09');
    expect(metrics.dayNumber).toBe(3);
  });

  test('calculates daily progress, streak, and consistency from unique tasks', () => {
    const metrics = getJourneyMetrics(
      enrollment([
        ...completeDay('2026-03-07'),
        ...completeDay('2026-03-08'),
        { taskId: journey.habits[0].id, dateKey: '2026-03-09' },
        { taskId: journey.habits[0].id, dateKey: '2026-03-09' },
        { taskId: 'unknown-task', dateKey: '2026-03-09' },
      ]),
      journey,
      '2026-03-09',
    );
    expect(metrics).toMatchObject({
      dayNumber: 3,
      completedToday: 1,
      totalTasks: 3,
      percentage: 33,
      streak: 2,
      consistency: 78,
    });
  });

  test('clamps the final day and marks the journey completed afterward', () => {
    const shortJourney = { ...journey, durationDays: 3 };
    expect(
      getJourneyMetrics(enrollment(), shortJourney, '2026-03-09'),
    ).toMatchObject({ dayNumber: 3, isCompleted: false });
    expect(
      getJourneyMetrics(enrollment(), shortJourney, '2026-03-10'),
    ).toMatchObject({ dayNumber: 3, isCompleted: true });
    expect(getJourneyFinalDateKey('2026-12-31', 2)).toBe('2027-01-01');
  });
});
