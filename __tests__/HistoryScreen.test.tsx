import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getSwipeTargetIndex } from '../src/components/common/SwipeableTabView';
import { ThemeProvider } from '../src/context/ThemeContext';
import { HistoryScreen } from '../src/screens/history/HistoryScreen';

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
});
