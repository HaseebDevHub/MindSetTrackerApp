import type { HabitItem } from '../src/types/models';
import { getSplashMetrics } from '../src/utils/splashMetrics';

const habit: HabitItem = {
  id: 'splash-metric-habit',
  title: 'Walk',
  timeOfDay: 'MORNING',
  completedDates: ['2026-09-07', '2026-09-08'],
  streakCount: 0,
  iconName: 'Footprints',
  createdAt: '2026-09-06',
};

describe('splash metrics', () => {
  test('calculates local app days and current-week completions', () => {
    expect(
      getSplashMetrics([habit], '2026-09-06', new Date(2026, 8, 8), 1),
    ).toEqual({ appDay: 3, completedThisWeek: 2 });
  });

  test('counts calendar days safely across a DST boundary', () => {
    expect(
      getSplashMetrics([], '2026-03-07', new Date(2026, 2, 9), 0).appDay,
    ).toBe(3);
  });

  test('clamps missing or future usage ranges to day one', () => {
    expect(
      getSplashMetrics([], '2026-09-09', new Date(2026, 8, 8), 0).appDay,
    ).toBe(1);
  });
});
