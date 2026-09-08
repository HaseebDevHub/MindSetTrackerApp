import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemeProvider } from '../src/context/ThemeContext';
import { FirstHabitScreen } from '../src/screens/onboarding/FirstHabitScreen';
import { onboardingStorage } from '../src/storage/onboardingStorage';
import { useAppStore } from '../src/store/useAppStore';

jest.mock('@shopify/flash-list', () => ({
  FlashList: require('react-native').FlatList,
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    { __esModule: true },
    {
      get: (target, property) =>
        property === '__esModule' ? target.__esModule : View,
    },
  );
});

describe('FirstHabitScreen', () => {
  beforeEach(() => {
    onboardingStorage.resetOnboarding();
    useAppStore.setState({ firstHabit: undefined });
  });

  afterAll(() => onboardingStorage.resetOnboarding());

  test('skips first-habit creation and continues to plan generation', () => {
    const navigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
    };
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <FirstHabitScreen
            navigation={navigation as never}
            route={{ key: 'FirstHabit', name: 'FirstHabit' }}
          />
        </ThemeProvider>,
      );
    });

    const skipButton = renderer!.root.findByProps({
      accessibilityLabel: 'SKIP',
    });
    act(() => skipButton.props.onPress());

    expect(onboardingStorage.hasSkippedFirstHabit()).toBe(true);
    expect(onboardingStorage.getFirstHabit()).toBeUndefined();
    expect(navigation.navigate).toHaveBeenCalledWith('PlanGenerator');
    act(() => renderer!.unmount());
  });
});
