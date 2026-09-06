import React from 'react';
import { StyleSheet, Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/context/ThemeContext';
import { setSelectedLanguage } from '../src/localization';
import { HabitDetailScreen } from '../src/screens/today/HabitDetailScreen';
import { useAppStore } from '../src/store/useAppStore';

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

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

test('localizes habit details without translating user-created content', () => {
  setSelectedLanguage('German');
  useAppStore.setState({
    habits: [
      {
        id: 'localized-habit',
        title: 'My custom title',
        timeOfDay: 'MORNING',
        completedDates: [],
        streakCount: 0,
        iconName: 'BookOpen',
        scheduleMode: 'WEEKLY_QUOTA',
        quotaCount: 3,
      },
    ],
  });
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ThemeProvider initialMode="dark">
          <HabitDetailScreen
            navigation={{ goBack: jest.fn(), navigate: jest.fn() } as never}
            route={{
              key: 'HabitDetail',
              name: 'HabitDetail',
              params: { habitId: 'localized-habit' },
            }}
          />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
  });
  const copy = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity);
  expect(copy).toContain('GEWOHNHEITSDETAILS');
  expect(copy).toContain('My custom title');
  expect(copy).toContain('ERFOLGREICHE TAGE INSGESAMT');
  act(() => renderer!.unmount());
  setSelectedLanguage('English');
});

test('uses scoped RTL alignment for Urdu habit details', () => {
  setSelectedLanguage('Urdu');
  useAppStore.setState({
    habits: [
      {
        id: 'rtl-habit',
        title: 'میری عادت',
        timeOfDay: 'MORNING',
        completedDates: [],
        streakCount: 0,
        iconName: 'BookOpen',
      },
    ],
  });
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ThemeProvider initialMode="dark">
          <HabitDetailScreen
            navigation={{ goBack: jest.fn(), navigate: jest.fn() } as never}
            route={{
              key: 'HabitDetail',
              name: 'HabitDetail',
              params: { habitId: 'rtl-habit' },
            }}
          />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
  });

  const title = renderer!.root
    .findAllByType(Text)
    .find(node => node.props.children === 'میری عادت');
  expect(StyleSheet.flatten(title!.props.style)).toMatchObject({
    textAlign: 'right',
    writingDirection: 'rtl',
  });

  act(() => renderer!.unmount());
  setSelectedLanguage('English');
});
