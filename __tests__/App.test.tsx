import { useAppStore } from '../src/store/useAppStore';
import type { HabitItem, TodayFilter } from '../src/types/models';
import {
  addDays,
  fromDateKey,
  getDateStatus,
  getCalendarDays,
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
    ).toHaveLength(filter === 'ALL' ? 3 : filter === 'AFTERNOON' ? 1 : 2);
    expect(habits.map(habit => habit.timeOfDay)).toEqual([
      'MORNING',
      'AFTERNOON',
      'EVENING',
      'ANYTIME',
      'MORNING',
    ]);
  });
});
