import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TodayScreen } from '../src/screens/today/TodayScreen';
import { ThemeProvider } from '../src/context/ThemeContext';
import { colors } from '../src/constants/theme';
import { useAppStore } from '../src/store/useAppStore';
import { addDays, fromDateKey, toDateKey } from '../src/utils/dates';

jest.mock('@shopify/flash-list', () => ({
  FlashList: require('react-native').FlatList,
}));
jest.mock(
  'lucide-react-native',
  () =>
    new Proxy(
      { __esModule: true },
      {
        get: (target, property) =>
          property === '__esModule' ? target.__esModule : () => null,
      },
    ),
);
jest.mock('../src/components/habit/HabitCard', () => ({
  HabitCard: () => null,
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function TodayTestScreen() {
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider initialMode="dark">
        <TodayScreen
          navigation={{ navigate: jest.fn() } as never}
          route={{ key: 'TodayHome', name: 'TodayHome' }}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

describe('Today date strip', () => {
  test('stays compact while supporting past, future, and date selection', () => {
    jest.useFakeTimers();
    const initialDate = '2026-08-19';
    useAppStore.getState().setSelectedDate(initialDate);

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<TodayTestScreen />);
    });

    const dateList = renderer!.root
      .findAllByType(FlatList)
      .find(list => list.props.horizontal && list.props.data.length > 7);

    expect(dateList).toBeDefined();
    expect(StyleSheet.flatten(dateList!.props.style)).toMatchObject({
      height: 56,
      flexGrow: 0,
      flexShrink: 0,
    });

    const centerIndex = dateList!.props.data.findIndex(
      (date: Date) => toDateKey(date) === initialDate,
    );
    expect(toDateKey(dateList!.props.data[centerIndex - 1])).toBe(
      toDateKey(addDays(fromDateKey(initialDate), -1)),
    );
    expect(toDateKey(dateList!.props.data[centerIndex + 1])).toBe(
      toDateKey(addDays(fromDateKey(initialDate), 1)),
    );

    const nextDate = dateList!.props.data[centerIndex + 1] as Date;
    const nextDateCell = dateList!.props.renderItem({ item: nextDate });
    act(() => {
      nextDateCell.props.onPress();
      jest.runOnlyPendingTimers();
    });

    expect(useAppStore.getState().selectedDate).toBe(toDateKey(nextDate));
    const updatedDateList = renderer!.root
      .findAllByType(FlatList)
      .find(list => list.props.horizontal && list.props.data.length > 7);
    const selectedCell = updatedDateList!.props.renderItem({ item: nextDate });
    expect(StyleSheet.flatten(selectedCell.props.style)).toMatchObject({
      borderBottomColor: colors.primary,
    });

    act(() => renderer!.unmount());
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('ALL activates the filter and exposes every non-archived habit', () => {
    jest.useFakeTimers();
    useAppStore.getState().setSelectedFilter('MORNING');
    const timeOfDayBefore = useAppStore
      .getState()
      .habits.map(habit => habit.timeOfDay);

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<TodayTestScreen />);
    });

    const filterList = renderer!.root
      .findAllByType(FlatList)
      .find(list => list.props.horizontal && list.props.data[0]?.key === 'ALL');

    expect(
      filterList!.props.data.map(({ key }: { key: string }) => key),
    ).toEqual(['ALL', 'MORNING', 'AFTERNOON', 'EVENING']);

    const allFilter = filterList!.props.renderItem({
      item: filterList!.props.data[0],
    });
    act(() => {
      allFilter.props.onPress();
      jest.runOnlyPendingTimers();
    });

    expect(useAppStore.getState().selectedFilter).toBe('ALL');
    expect(useAppStore.getState().habits.map(habit => habit.timeOfDay)).toEqual(
      timeOfDayBefore,
    );

    const updatedFilterList = renderer!.root
      .findAllByType(FlatList)
      .find(list => list.props.horizontal && list.props.data[0]?.key === 'ALL');
    const activeAllFilter = updatedFilterList!.props.renderItem({
      item: updatedFilterList!.props.data[0],
    });
    expect(StyleSheet.flatten(activeAllFilter.props.style)).toMatchObject({
      backgroundColor: colors.selectedBlue,
    });
    expect(activeAllFilter.props.children[0].props.color).toBe(colors.yellow);

    const inactiveMorningFilter = updatedFilterList!.props.renderItem({
      item: updatedFilterList!.props.data[1],
    });
    expect(inactiveMorningFilter.props.children[0].props.color).toBe(
      colors.textSecondary,
    );

    act(() => renderer!.unmount());
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('moves only the completed habit into the finished section', () => {
    jest.useFakeTimers();
    const date = '2026-08-25';
    const originalState = useAppStore.getState();
    useAppStore.setState({
      selectedDate: date,
      selectedFilter: 'ALL',
      habits: [
        {
          id: 'first',
          title: 'First habit',
          timeOfDay: 'MORNING',
          completedDates: [],
          streakCount: 0,
          iconName: 'Droplets',
        },
        {
          id: 'second',
          title: 'Second habit',
          timeOfDay: 'AFTERNOON',
          completedDates: [],
          streakCount: 0,
          iconName: 'BookOpen',
        },
        {
          id: 'third',
          title: 'Third habit',
          timeOfDay: 'EVENING',
          completedDates: [],
          streakCount: 0,
          iconName: 'Moon',
        },
      ],
    });

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<TodayTestScreen />);
    });

    act(() => {
      useAppStore.getState().toggleHabit('first', date);
      jest.runOnlyPendingTimers();
    });

    const habitList = renderer!.root
      .findAllByType(FlatList)
      .find(list =>
        list.props.data.some(
          (item: { type?: string }) => item.type === 'habit',
        ),
      );
    const rows = habitList!.props.data.map(
      (item: { type: string; habit?: { id: string } }) =>
        item.type === 'habit' ? item.habit!.id : item.type,
    );

    expect(rows).toEqual(['second', 'third', 'finishedHeader', 'first']);
    expect(rows.filter((row: string) => row === 'first')).toHaveLength(1);
    expect(
      useAppStore.getState().habits.find(habit => habit.id === 'second')
        ?.completedDates,
    ).not.toContain(date);

    act(() => {
      useAppStore.getState().toggleHabit('second', date);
      jest.runOnlyPendingTimers();
    });
    const updatedHabitList = renderer!.root
      .findAllByType(FlatList)
      .find(list =>
        list.props.data.some(
          (item: { type?: string }) => item.type === 'habit',
        ),
      );
    expect(
      updatedHabitList!.props.data.map(
        (item: { type: string; habit?: { id: string } }) =>
          item.type === 'habit' ? item.habit!.id : item.type,
      ),
    ).toEqual(['third', 'finishedHeader', 'first', 'second']);

    act(() => {
      useAppStore.getState().setSelectedFilter('MORNING');
      jest.runOnlyPendingTimers();
    });
    const morningList = renderer!.root
      .findAllByType(FlatList)
      .find(list =>
        list.props.data.some(
          (item: { type?: string }) => item.type === 'habit',
        ),
      );
    expect(
      morningList!.props.data.map(
        (item: { type: string; habit?: { id: string } }) =>
          item.type === 'habit' ? item.habit!.id : item.type,
      ),
    ).toEqual(['finishedHeader', 'first']);

    act(() => renderer!.unmount());
    useAppStore.setState({
      selectedDate: originalState.selectedDate,
      selectedFilter: originalState.selectedFilter,
      habits: originalState.habits,
    });
    jest.clearAllTimers();
    jest.useRealTimers();
  });
});
