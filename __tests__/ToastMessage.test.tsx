import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ToastMessage } from '../src/components/common/ToastMessage';
import { ThemeProvider } from '../src/context/ThemeContext';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    Easing: { cubic: jest.fn(), in: jest.fn(() => jest.fn()) },
    cancelAnimation: jest.fn(),
    runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
    useAnimatedStyle: (factory: () => object) => factory(),
    useSharedValue: (value: unknown) => ({ value }),
    withSpring: (value: unknown) => value,
    withTiming: (
      value: unknown,
      _config: unknown,
      callback?: (finished: boolean) => void,
    ) => {
      callback?.(true);
      return value;
    },
  };
});

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

describe('ToastMessage', () => {
  test('renders the message and dismisses it after the configured duration', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <ToastMessage
            visible
            message="Habit created successfully"
            duration={1000}
            onDismiss={onDismiss}
          />
        </ThemeProvider>,
      );
    });

    expect(
      renderer!.root.findAllByType(Text).some(
        node => node.props.children === 'Habit created successfully',
      ),
    ).toBe(true);
    act(() => jest.advanceTimersByTime(999));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(1));
    expect(onDismiss).toHaveBeenCalledTimes(1);

    act(() => renderer!.unmount());
    jest.useRealTimers();
  });
});
