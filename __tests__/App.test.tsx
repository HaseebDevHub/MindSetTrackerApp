import { useAppStore } from '../src/store/useAppStore';
import type { HabitItem, TodayFilter } from '../src/types/models';
import {
  addDays,
  fromDateKey,
  getDateStatus,
  getCalendarDays,
  getWeekDateKeys,
  toDateKey,
} from '../src/utils/dates';
import { isHabitVisibleForTodayFilter } from '../src/utils/habits';

describe('local application behavior', () => {
  test('starts with no habits when the user has not created one', () => {
    expect(useAppStore.getState().habits).toEqual([]);
  });

  test('date keys round-trip without timezone drift', () => {
    const source = new Date(2026, 7, 18);
    expect(toDateKey(fromDateKey(toDateKey(source)))).toBe('2026-08-18');
    expect(toDateKey(addDays(source, 1))).toBe('2026-08-19');
    expect(getCalendarDays(source).filter(Boolean)).toHaveLength(31);
    expect(getWeekDateKeys('2026-09-01', 0)).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
    ]);
    expect(getWeekDateKeys('2026-09-01', 1)).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
    expect(getWeekDateKeys('2027-01-01', 1)).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
    expect(getWeekDateKeys('2028-02-29', 1)).toContain('2028-02-29');
  });

  test('classifies local date keys without comparing time-of-day timestamps', () => {
    const localToday = new Date(2026, 7, 27, 23, 59);
    expect(getDateStatus('2026-08-26', localToday)).toBe('past');
    expect(getDateStatus('2026-08-27', localToday)).toBe('today');
    expect(getDateStatus('2026-08-28', localToday)).toBe('future');
  });

  test('habit completion can be checked and undone', async () => {
    const originalHabits = useAppStore.getState().habits;
    const habit: HabitItem = {
      id: 'habit-completion-test',
      title: 'Test completion persistence',
      timeOfDay: 'MORNING',
      completedDates: [],
      streakCount: 0,
      iconName: 'Check',
    };
    useAppStore.setState({ habits: [habit], isHydrated: true });
    const date = toDateKey(new Date());
    expect(habit.completedDates).not.toContain(date);
    await useAppStore.getState().toggleHabit(habit.id, date);
    expect(useAppStore.getState().habits[0].completedDates).toContain(date);
    await useAppStore.getState().toggleHabit(habit.id, date);
    expect(useAppStore.getState().habits[0].completedDates).not.toContain(date);
    useAppStore.setState({ habits: originalHabits, isHydrated: false });
  });

  test.each<[TodayFilter, string[]]>([
    ['ALL', ['morning', 'afternoon', 'evening', 'anytime']],
    ['ANYTIME', ['anytime']],
    ['MORNING', ['morning', 'anytime']],
    ['AFTERNOON', ['afternoon', 'anytime']],
    ['EVENING', ['evening', 'anytime']],
  ])('%s filters the Today habits correctly', (filter, expectedIds) => {
    const habits: HabitItem[] = [
      {
        id: 'morning',
        title: 'Morning',
        timeOfDay: 'MORNING',
        completedDates: ['2026-08-19'],
        streakCount: 0,
        iconName: 'Sun',
      },
      {
        id: 'afternoon',
        title: 'Afternoon',
        timeOfDay: 'AFTERNOON',
        completedDates: [],
        streakCount: 0,
        iconName: 'Sun',
      },
      {
        id: 'evening',
        title: 'Evening',
        timeOfDay: 'EVENING',
        completedDates: ['2026-08-19'],
        streakCount: 0,
        iconName: 'Moon',
      },
      {
        id: 'anytime',
        title: 'Anytime',
        timeOfDay: 'ANYTIME',
        completedDates: ['2026-08-19'],
        streakCount: 0,
        iconName: 'Check',
      },
      {
        id: 'archived',
        title: 'Archived',
        timeOfDay: 'MORNING',
        completedDates: ['2026-08-19'],
        streakCount: 0,
        iconName: 'Sun',
        archived: true,
      },
    ];

    const visible = habits.filter(habit =>
      isHabitVisibleForTodayFilter(habit, filter),
    );

    expect(visible.map(habit => habit.id)).toEqual(expectedIds);
    expect(
      visible.filter(habit => habit.completedDates.includes('2026-08-19')),
    ).toHaveLength(
      filter === 'ALL' || filter === 'ANYTIME' || filter === 'AFTERNOON'
        ? filter === 'ALL'
          ? 3
          : 1
        : 2,
    );
    expect(habits.map(habit => habit.timeOfDay)).toEqual([
      'MORNING',
      'AFTERNOON',
      'EVENING',
      'ANYTIME',
      'MORNING',
    ]);
  });
});
