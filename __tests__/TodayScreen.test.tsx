import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { TodayScreen } from '../src/screens/today/TodayScreens';
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

describe('Today date strip', () => {
  test('stays compact while supporting past, future, and date selection', () => {
    jest.useFakeTimers();
    const initialDate = '2026-08-19';
    useAppStore.getState().setSelectedDate(initialDate);

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <TodayScreen
          navigation={{ navigate: jest.fn() } as never}
          route={{ key: 'TodayHome', name: 'TodayHome' }}
        />,
      );
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
      renderer = TestRenderer.create(
        <TodayScreen
          navigation={{ navigate: jest.fn() } as never}
          route={{ key: 'TodayHome', name: 'TodayHome' }}
        />,
      );
    });

    const filterList = renderer!.root
      .findAllByType(FlatList)
      .find(list => list.props.horizontal && list.props.data[0]?.key === 'ALL');

    expect(filterList!.props.data.map(({ key }: { key: string }) => key)).toEqual(
      ['ALL', 'MORNING', 'AFTERNOON', 'EVENING'],
    );

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

    act(() => renderer!.unmount());
    jest.clearAllTimers();
    jest.useRealTimers();
  });
});
