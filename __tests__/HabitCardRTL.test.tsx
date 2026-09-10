import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemeProvider } from '../src/context/ThemeContext';
import { HabitCard } from '../src/components/habit/HabitCard';
import { setSelectedLanguage, t } from '../src/localization';

jest.mock('react-native-reanimated', () => {
  const { View: NativeView } = require('react-native');
  return {
    __esModule: true,
    default: { View: NativeView },
    interpolateColor: jest.fn((_value, _input, output) => output[0]),
    useAnimatedStyle: (factory: () => object) => factory(),
    useSharedValue: (value: unknown) => ({ value }),
    withSpring: (value: unknown) => value,
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

test('mirrors a habit card and right-aligns Urdu content', () => {
  setSelectedLanguage('Urdu');
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <ThemeProvider initialMode="dark">
        <HabitCard
          habit={{
            id: 'rtl-card',
            title: 'پانی پئیں',
            timeOfDay: 'MORNING',
            completedDates: [],
            streakCount: 0,
            iconName: 'Droplets',
          }}
          completed={false}
          completionDisabled={false}
          selectedDate="2026-09-05"
          onToggle={jest.fn()}
          onMenu={jest.fn()}
        />
      </ThemeProvider>,
    );
  });

  const checkbox = renderer!.root.findByProps({
    accessibilityRole: 'checkbox',
  });
  expect(StyleSheet.flatten(checkbox.parent!.props.style)).toMatchObject({
    flexDirection: 'row-reverse',
  });
  const title = renderer!.root
    .findAllByType(Text)
    .find(node => node.props.children === 'پانی پئیں');
  expect(StyleSheet.flatten(title!.props.style)).toMatchObject({
    textAlign: 'right',
    writingDirection: 'rtl',
  });
  expect(
    renderer!.root
      .findAllByType(Text)
      .some(node => node.props.children === 'صبح'),
  ).toBe(true);
  expect(renderer!.root.findAllByType(View).length).toBeGreaterThan(0);

  act(() => renderer!.unmount());
  setSelectedLanguage('English');
});

test.each(['dark', 'light'] as const)(
  'renders mode-specific indicators across completion and direction in %s',
  mode => {
    for (const language of ['English', 'Urdu'] as const)
      for (const completed of [false, true])
        for (const type of ['reminder', 'alarm'] as const)
          for (const enabled of [false, true]) {
            setSelectedLanguage(language);
            let renderer: TestRenderer.ReactTestRenderer;
            act(() => {
              renderer = TestRenderer.create(
                <ThemeProvider initialMode={mode}>
                  <HabitCard
                    habit={{
                      id: 'indicator',
                      title: 'Walk',
                      iconName: 'Footprints',
                      timeOfDay: 'ANYTIME',
                      completedDates: [],
                      streakCount: 0,
                      reminderType: type,
                      reminderEnabled: enabled,
                    }}
                    completed={completed}
                    completionDisabled={completed}
                    selectedDate="2026-09-08"
                    onToggle={jest.fn()}
                    onMenu={jest.fn()}
                  />
                </ThemeProvider>,
              );
            });
            const label = t(
              type === 'alarm'
                ? 'habit_alarm_enabled_accessibility'
                : 'habit_reminder_enabled_accessibility',
            );
            expect(
              renderer!.root
                .findAllByType(View)
                .some(node => node.props.accessibilityLabel === label),
            ).toBe(enabled);
            act(() => renderer.unmount());
          }
    setSelectedLanguage('English');
  },
);
