import {useAppStore} from '../src/store/useAppStore';
import {addDays, fromDateKey, getCalendarDays, toDateKey} from '../src/utils/dates';

describe('local application behavior', () => {
  test('date keys round-trip without timezone drift', () => {
    const source = new Date(2026, 7, 18);
    expect(toDateKey(fromDateKey(toDateKey(source)))).toBe('2026-08-18');
    expect(toDateKey(addDays(source, 1))).toBe('2026-08-19');
    expect(getCalendarDays(source).filter(Boolean)).toHaveLength(31);
  });

  test('habit completion can be checked and undone', () => {
    const habit = useAppStore.getState().habits[0];
    const date = '2030-01-02';
    expect(habit.completedDates).not.toContain(date);
    useAppStore.getState().toggleHabit(habit.id, date);
    expect(useAppStore.getState().habits[0].completedDates).toContain(date);
    useAppStore.getState().toggleHabit(habit.id, date);
    expect(useAppStore.getState().habits[0].completedDates).not.toContain(date);
  });
});
