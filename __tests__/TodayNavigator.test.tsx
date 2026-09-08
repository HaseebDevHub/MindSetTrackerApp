import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../src/components/common/ScreenContainer';
import { TabScreenProvider } from '../src/context/TabScreenContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { shouldShowTodayTabBar } from '../src/navigation/MainTabNavigator';
import { TodayChildScreenLayout } from '../src/navigation/TodayNavigator';

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

jest.mock('../src/navigation/HistoryNavigator', () => ({
  HistoryNavigator: () => null,
}));

jest.mock('../src/navigation/JourneyNavigator', () => ({
  JourneyNavigator: () => null,
}));

jest.mock('../src/navigation/MeNavigator', () => ({
  MeNavigator: () => null,
}));

jest.mock('../src/screens/today/CreateHabitScreen', () => ({
  CreateHabitScreen: () => null,
}));

jest.mock('../src/screens/today/HabitDetailScreen', () => ({
  HabitDetailScreen: () => null,
}));

jest.mock('../src/screens/today/TodayScreen', () => ({
  TodayScreen: () => null,
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe('Today navigator tab-bar visibility', () => {
  test('shows tabs only on Today home', () => {
    expect(shouldShowTodayTabBar()).toBe(true);
    expect(shouldShowTodayTabBar('TodayHome')).toBe(true);
    expect(shouldShowTodayTabBar('CreateHabit')).toBe(false);
    expect(shouldShowTodayTabBar('HabitDetail')).toBe(false);
  });

  test('restores the bottom safe-area inset on Today child screens', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <ThemeProvider initialMode="dark">
            <TabScreenProvider value>
              <TodayChildScreenLayout>
                <ScreenContainer>
                  <Text>Child screen</Text>
                </ScreenContainer>
              </TodayChildScreenLayout>
            </TabScreenProvider>
          </ThemeProvider>
        </SafeAreaProvider>,
      );
    });

    expect(renderer!.root.findByType(SafeAreaView).props.edges).toEqual([
      'top',
      'left',
      'right',
      'bottom',
    ]);
    act(() => renderer!.unmount());
  });
});
