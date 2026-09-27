import { journeys } from '../src/data/journeyPlans';
import type { ActiveJourneyItem } from '../src/types/models';
import { addDays, fromDateKey, toDateKey } from '../src/utils/dates';
import {
  getJourneyDays,
  getJourneyDayTasks,
  getJourneyFinalDateKey,
  getJourneyMetrics,
} from '../src/utils/journeyAnalytics';
import { english } from '../src/localization/languages/english';
import { french } from '../src/localization/languages/french';
import { german } from '../src/localization/languages/german';
import { spanish } from '../src/localization/languages/spanish';
import { urdu } from '../src/localization/languages/urdu';

const morning = journeys.find(journey => journey.id === 'morning')!;
const enrollment = (
  overrides: Partial<ActiveJourneyItem> = {},
): ActiveJourneyItem => ({
  id: 'morning-enrollment',
  journeyId: 'morning',
  startedDateKey: '2026-09-27',
  planVersion: 1,
  isActive: true,
  taskCompletions: [],
  ...overrides,
});

it.each(journeys)(
  '$id has a bounded, repeatable progression for every day',
  journey => {
    expect(journey.schedule).toHaveLength(journey.durationDays);
    expect(getJourneyDayTasks(journey, 1)).toHaveLength(1);
    expect(
      getJourneyDayTasks(journey, journey.durationDays).length,
    ).toBeGreaterThan(1);
    journey.schedule.forEach((day, index) => {
      expect(day.dayNumber).toBe(index + 1);
      expect(day.taskIds.length).toBeGreaterThan(0);
      expect(day.taskIds.length).toBeLessThanOrEqual(4);
      expect(new Set(day.taskIds).size).toBe(day.taskIds.length);
      expect(
        getJourneyDayTasks(journey, day.dayNumber).map(task => task.id),
      ).toEqual(day.taskIds);
      if (index)
        expect(day.taskIds).toEqual(
          expect.arrayContaining(journey.schedule[index - 1].taskIds),
        );
    });
    for (const dictionary of [english, french, german, spanish, urdu]) {
      for (const task of journey.tasks) {
        expect(dictionary[task.titleKey]).toBeTruthy();
        expect(dictionary[task.subtitleKey]).toBeTruthy();
      }
    }
  },
);

it('introduces breakfast on day 2 without leaking recurring completions', () => {
  const active = enrollment({
    taskCompletions: [{ taskId: 'morning-drink-water', dateKey: '2026-09-27' }],
  });
  const days = getJourneyDays(active, morning, '2026-09-28');
  expect(days[0]).toMatchObject({ finished: true, status: 'past' });
  expect(days[1].tasks.map(task => task.id)).toEqual([
    'morning-drink-water',
    'morning-breakfast',
  ]);
  expect(days[1]).toMatchObject({
    finished: false,
    completedTaskIds: [],
    status: 'current',
  });
  expect(days[2].status).toBe('future');
  expect(getJourneyMetrics(active, morning, '2026-09-28')).toMatchObject({
    daysFinished: 1,
    completedToday: 0,
    totalTasks: 2,
    consistency: 33,
    streak: 1,
  });
});

it('counts fully assigned days, deduplicates records and excludes unassigned tasks', () => {
  const active = enrollment({
    taskCompletions: [
      { taskId: 'morning-drink-water', dateKey: '2026-09-27' },
      { taskId: 'morning-drink-water', dateKey: '2026-09-27' },
      { taskId: 'morning-priority', dateKey: '2026-09-27' },
      { taskId: 'morning-drink-water', dateKey: '2026-09-28' },
      { taskId: 'unknown', dateKey: '2026-09-28' },
    ],
  });
  expect(getJourneyMetrics(active, morning, '2026-09-28')).toMatchObject({
    daysFinished: 1,
    percentage: 50,
    consistency: 67,
    streak: 1,
  });
  active.taskCompletions.push({
    taskId: 'morning-breakfast',
    dateKey: '2026-09-28',
  });
  expect(getJourneyMetrics(active, morning, '2026-09-28')).toMatchObject({
    daysFinished: 2,
    percentage: 100,
    consistency: 100,
    streak: 2,
  });
  expect(getJourneyMetrics(active, morning, '2026-09-30')).toMatchObject({
    daysFinished: 2,
    streak: 0,
    consistency: 43,
  });
});

it('does not falsely finish legacy days after migration', () => {
  const active = enrollment({
    planVersion: undefined,
    taskCompletions: [{ taskId: 'morning-drink-water', dateKey: '2026-09-27' }],
  });
  expect(getJourneyDays(active, morning, '2026-09-27')[0].tasks).toHaveLength(
    3,
  );
  expect(getJourneyMetrics(active, morning, '2026-09-27')).toMatchObject({
    daysFinished: 0,
    percentage: 33,
  });
  expect(
    getJourneyDays(JSON.parse(JSON.stringify(active)), morning, '2026-09-27'),
  ).toEqual(getJourneyDays(active, morning, '2026-09-27'));
});

it.each([
  ['2026-12-31', '2027-01-01'],
  ['2028-02-28', '2028-02-29'],
  ['2028-02-29', '2028-03-01'],
  ['2026-03-08', '2026-03-09'],
  ['2026-11-01', '2026-11-02'],
])('maps local calendar dates from %s to %s', (start, next) => {
  const active = enrollment({ startedDateKey: start });
  expect(getJourneyDays(active, morning, next)[1]).toMatchObject({
    dateKey: next,
    status: 'current',
  });
  expect(getJourneyFinalDateKey(start, 2)).toBe(next);
  expect(toDateKey(addDays(fromDateKey(start), 1))).toBe(next);
});

it('handles before-start, final, expired and corrupt dates without invented progress', () => {
  const active = enrollment();
  expect(
    getJourneyDays(active, morning, '2026-09-26').every(
      day => day.status === 'future',
    ),
  ).toBe(true);
  expect(getJourneyMetrics(active, morning, '2026-10-17')).toMatchObject({
    dayNumber: 21,
    isCompleted: false,
  });
  expect(getJourneyMetrics(active, morning, '2026-10-18')).toMatchObject({
    dayNumber: 21,
    isCompleted: true,
    daysFinished: 0,
  });
  expect(
    getJourneyDays(
      enrollment({ startedDateKey: 'invalid' }),
      morning,
      '2026-09-27',
    ),
  ).toEqual([]);
  expect(getJourneyFinalDateKey('2026-02-30', 2)).toBeUndefined();
});
