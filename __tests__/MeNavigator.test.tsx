import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../src/components/common/ScreenContainer';
import { TabScreenProvider } from '../src/context/TabScreenContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { shouldShowMeTabBar } from '../src/navigation/MainTabNavigator';
import { MeChildScreenLayout } from '../src/navigation/MeNavigator';

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

jest.mock('../src/navigation/TodayNavigator', () => ({
  TodayNavigator: () => null,
}));

jest.mock('../src/screens/me/FeedbackScreen', () => ({
  FeedbackScreen: () => null,
}));

jest.mock('../src/screens/me/GeneralSettingsScreen', () => ({
  GeneralSettingsScreen: () => null,
}));

jest.mock('../src/screens/me/LanguageSettingsScreen', () => ({
  LanguageSettingsScreen: () => null,
}));

jest.mock('../src/screens/me/MeScreen', () => ({
  MeScreen: () => null,
}));

jest.mock('../src/screens/me/NotificationSettingsScreen', () => ({
  NotificationSettingsScreen: () => null,
}));

jest.mock('../src/screens/me/PremiumScreen', () => ({
  PremiumScreen: () => null,
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe('Me navigator tab-bar visibility', () => {
  test('shows tabs only on Me home', () => {
    expect(shouldShowMeTabBar()).toBe(true);
    expect(shouldShowMeTabBar('MeHome')).toBe(true);
    expect(shouldShowMeTabBar('Premium')).toBe(false);
    expect(shouldShowMeTabBar('Notifications')).toBe(false);
    expect(shouldShowMeTabBar('GeneralSettings')).toBe(false);
    expect(shouldShowMeTabBar('Language')).toBe(false);
    expect(shouldShowMeTabBar('Feedback')).toBe(false);
  });

  test('restores the bottom safe-area inset on Me child screens', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <ThemeProvider initialMode="dark">
            <TabScreenProvider value>
              <MeChildScreenLayout>
                <ScreenContainer>
                  <Text>Child screen</Text>
                </ScreenContainer>
              </MeChildScreenLayout>
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
