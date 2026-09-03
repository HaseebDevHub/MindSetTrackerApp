import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { FlatList, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getSwipeTargetIndex } from '../src/components/common/SwipeableTabView';
import { ThemeProvider } from '../src/context/ThemeContext';
import { colors, lightColors } from '../src/constants/theme';
import { HistoryScreen } from '../src/screens/history/HistoryScreen';
import { useAppStore } from '../src/store/useAppStore';
import { addDays, toDateKey } from '../src/utils/dates';

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  const gesture = {
    activeOffsetX: jest.fn().mockReturnThis(),
    failOffsetY: jest.fn().mockReturnThis(),
    onBegin: jest.fn().mockReturnThis(),
    onUpdate: jest.fn().mockReturnThis(),
    onEnd: jest.fn().mockReturnThis(),
    onFinalize: jest.fn().mockReturnThis(),
  };
  return {
    Gesture: { Pan: () => gesture },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: View,
  };
});
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (component: React.ComponentType) => component,
    },
    cancelAnimation: jest.fn(),
    runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
    useAnimatedStyle: (factory: () => object) => factory(),
    useSharedValue: (value: unknown) => ({ value }),
    withTiming: (value: unknown) => value,
  };
});
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

describe('History tabs', () => {
  test('renders all three tabs and switches the selected tab', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <GestureHandlerRootView>
          <ThemeProvider initialMode="dark">
            <HistoryScreen />
          </ThemeProvider>
        </GestureHandlerRootView>,
      );
    });

    const tabNames = ['Calendar', 'All Habits', 'Achievements'];
    const tabButtons = tabNames.map(
      name =>
        renderer!.root.findAll(
          node =>
            node.props.accessibilityRole === 'tab' &&
            node.props.accessibilityLabel === name,
        )[0],
    );

    expect(tabButtons).toHaveLength(3);
    expect(
      tabButtons.map(button => button.props.children.props.children),
    ).toEqual(['Calendar', 'All Habits', 'Achievements']);
    expect(tabButtons[0].props.accessibilityState).toEqual({ selected: true });

    act(() => tabButtons[2].props.onPress());

    const updatedTabs = tabNames.map(
      name =>
        renderer!.root.findAll(
          node =>
            node.props.accessibilityRole === 'tab' &&
            node.props.accessibilityLabel === name,
        )[0],
    );
    expect(updatedTabs[2].props.accessibilityState).toEqual({ selected: true });

    act(() => renderer!.unmount());
  });

  test.each([
    ['left from Calendar', 0, -80, 0, 1],
    ['left from All Habits', 1, -80, 0, 2],
    ['right from Achievements', 2, 80, 0, 1],
    ['right from All Habits', 1, 80, 0, 0],
    ['right boundary', 0, 80, 0, 0],
    ['left boundary', 2, -80, 0, 2],
    ['small movement', 1, 30, 100, 1],
    ['fast left swipe', 0, -15, -700, 1],
    ['fast right swipe', 2, 15, 700, 1],
  ])(
    '%s resolves to the correct tab',
    (_, current, distance, velocity, next) => {
      expect(getSwipeTargetIndex(current, 3, distance, velocity)).toBe(next);
    },
  );

  test('calendar selection updates the shared Today date context', () => {
    const originalDate = useAppStore.getState().selectedDate;
    const onDateSelected = jest.fn();
    const now = new Date();
    const target = addDays(now, now.getDate() === 1 ? 1 : -1);
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <GestureHandlerRootView>
          <ThemeProvider initialMode="dark">
            <HistoryScreen onDateSelected={onDateSelected} />
          </ThemeProvider>
        </GestureHandlerRootView>,
      );
    });

    const targetDay = renderer!.root
      .findAllByProps({ accessibilityLabel: target.toDateString() })
      .find(node => typeof node.props.onPress === 'function');
    expect(targetDay).toBeDefined();
    act(() => targetDay!.props.onPress());
    expect(useAppStore.getState().selectedDate).toBe(toDateKey(target));
    expect(onDateSelected).toHaveBeenCalledWith(toDateKey(target));

    act(() => renderer!.unmount());
    useAppStore.getState().setSelectedDate(originalDate);
  });

  test('updates the calendar order reactively when week start changes', () => {
    const originalDate = useAppStore.getState().selectedDate;
    const originalWeekStart = useAppStore.getState().weekStartsOn;
    useAppStore.setState({ selectedDate: '2026-09-01', weekStartsOn: 0 });
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <GestureHandlerRootView>
          <ThemeProvider initialMode="dark">
            <HistoryScreen />
          </ThemeProvider>
        </GestureHandlerRootView>,
      );
    });

    const getWeekdayList = () =>
      renderer!.root
        .findAllByType(FlatList)
        .find(
          list =>
            list.props.data?.length === 7 &&
            list.props.data.every((day: { long?: string }) => day.long),
        );
    expect(getWeekdayList()!.props.data.map((day: { long: string }) => day.long))
      .toEqual([
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ]);

    act(() => useAppStore.setState({ weekStartsOn: 1 }));
    expect(getWeekdayList()!.props.data.map((day: { long: string }) => day.long))
      .toEqual([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ]);
    expect(useAppStore.getState().selectedDate).toBe('2026-09-01');

    act(() => renderer!.unmount());
    useAppStore.setState({
      selectedDate: originalDate,
      weekStartsOn: originalWeekStart,
    });
  });

  test('shows selected-week progress below the calendar', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 30, 12));
    const originalHabits = useAppStore.getState().habits;
    useAppStore.setState({
      selectedDate: '2026-08-25',
      weekStartsOn: 0,
      habits: [
        {
          id: 'weekly-progress-habit',
          title: 'Weekly habit',
          timeOfDay: 'MORNING',
          frequency: 'EVERYDAY',
          createdAt: '2026-08-23',
          completedDates: ['2026-08-23', '2026-08-24', '2026-08-25'],
          streakCount: 0,
          iconName: 'Check',
        },
      ],
    });

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <GestureHandlerRootView>
          <ThemeProvider initialMode="dark">
            <HistoryScreen />
          </ThemeProvider>
        </GestureHandlerRootView>,
      );
    });
    const renderedText = renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .filter(value => typeof value === 'string');

    expect(renderedText).toContain('WEEKLY PROGRESS');
    expect(renderedText).toContain('Selected week');
    expect(renderedText).toContain('43%');
    expect(renderedText).toContain('Progress completed');
    expect(renderedText).toContain('Progress scheduled');

    act(() => renderer!.unmount());
    useAppStore.setState({ habits: originalHabits });
    jest.useRealTimers();
  });

  test('renders exact partial progress and row-safe perfect-day streaks', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 10, 12));
    const originalState = useAppStore.getState();
    useAppStore.setState({
      selectedDate: '2026-09-03',
      weekStartsOn: 0,
      habits: [
        {
          id: 'calendar-progress-1',
          title: 'First calendar habit',
          timeOfDay: 'MORNING',
          frequency: 'EVERYDAY',
          createdAt: '2026-09-01',
          completedDates: [
            '2026-09-01',
            '2026-09-02',
            '2026-09-03',
            '2026-09-05',
            '2026-09-06',
          ],
          streakCount: 0,
          iconName: 'Check',
        },
        {
          id: 'calendar-progress-2',
          title: 'Second calendar habit',
          timeOfDay: 'EVENING',
          frequency: 'EVERYDAY',
          createdAt: '2026-09-01',
          completedDates: [
            '2026-09-01',
            '2026-09-02',
            '2026-09-05',
            '2026-09-06',
          ],
          streakCount: 0,
          iconName: 'Check',
        },
      ],
    });

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <GestureHandlerRootView>
          <ThemeProvider initialMode="dark">
            <HistoryScreen />
          </ThemeProvider>
        </GestureHandlerRootView>,
      );
    });

    const partialDay = renderer!.root.findByProps({
      testID: 'calendar-day-2026-09-03',
    });
    expect(partialDay.props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 50,
      text: '50% complete',
    });
    expect(
      renderer!.root.findByProps({
        testID: 'calendar-partial-2026-09-03',
      }),
    ).toBeDefined();
    expect(
      StyleSheet.flatten(
        renderer!.root.findByProps({
          testID: 'calendar-marker-2026-09-03',
        }).props.style,
      ),
    ).toMatchObject({ borderColor: colors.onPrimary });

    expect(
      StyleSheet.flatten(
        renderer!.root.findByProps({
          testID: 'calendar-marker-2026-09-01',
        }).props.style,
      ),
    ).toMatchObject({ backgroundColor: colors.primary });
    expect(
      renderer!.root.findByProps({
        testID: 'calendar-streak-right-2026-09-01',
      }),
    ).toBeDefined();
    expect(
      renderer!.root.findByProps({
        testID: 'calendar-streak-left-2026-09-02',
      }),
    ).toBeDefined();
    expect(
      renderer!.root.findAllByProps({
        testID: 'calendar-streak-right-2026-09-02',
      }),
    ).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({
        testID: 'calendar-streak-right-2026-09-05',
      }),
    ).toHaveLength(0);
    expect(
      renderer!.root.findAllByProps({
        testID: 'calendar-streak-left-2026-09-06',
      }),
    ).toHaveLength(0);

    act(() => renderer!.unmount());
    useAppStore.setState({
      habits: originalState.habits,
      selectedDate: originalState.selectedDate,
      weekStartsOn: originalState.weekStartsOn,
    });
    jest.useRealTimers();
  });

  test('uses a visible selected-date outline in light mode', () => {
    const originalState = useAppStore.getState();
    useAppStore.setState({
      selectedDate: '2026-09-03',
      weekStartsOn: 0,
      habits: [],
    });
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <GestureHandlerRootView>
          <ThemeProvider initialMode="light">
            <HistoryScreen />
          </ThemeProvider>
        </GestureHandlerRootView>,
      );
    });

    const selectedMarker = renderer!.root.findByProps({
      testID: 'calendar-marker-2026-09-03',
    });
    expect(StyleSheet.flatten(selectedMarker.props.style)).toMatchObject({
      borderColor: lightColors.text,
    });
    expect(lightColors.text).not.toBe(lightColors.surface);

    act(() => renderer!.unmount());
    useAppStore.setState({
      habits: originalState.habits,
      selectedDate: originalState.selectedDate,
      weekStartsOn: originalState.weekStartsOn,
    });
  });

  test('resumes an archived habit from All Habits', async () => {
    const originalHabits = useAppStore.getState().habits;
    useAppStore.setState({
      isHydrated: true,
      habits: [
        {
          id: 'archived-habit',
          title: 'Archived habit',
          timeOfDay: 'MORNING',
          completedDates: [],
          streakCount: 0,
          iconName: 'Check',
          archived: true,
          archivedAt: '2026-09-01',
          createdAt: '2026-08-01',
        },
      ],
    });
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <GestureHandlerRootView>
          <ThemeProvider initialMode="dark">
            <HistoryScreen />
          </ThemeProvider>
        </GestureHandlerRootView>,
      );
    });
    const allHabitsTab = renderer!.root.findAll(
      node =>
        node.props.accessibilityRole === 'tab' &&
        node.props.accessibilityLabel === 'All Habits',
    )[0];
    act(() => allHabitsTab.props.onPress());

    const resume = renderer!.root.findAll(
      node =>
        node.props.accessibilityLabel === 'Resume Archived habit' &&
        typeof node.props.onPress === 'function',
    )[0];
    expect(resume).toBeDefined();
    await act(async () => {
      resume.props.onPress({ stopPropagation: jest.fn() });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useAppStore.getState().habits[0]).toMatchObject({
      id: 'archived-habit',
      archived: false,
      archivedAt: undefined,
    });

    act(() => renderer!.unmount());
    useAppStore.setState({ habits: originalHabits });
  });
});
