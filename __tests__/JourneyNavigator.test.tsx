import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from '../src/components/common/ScreenContainer';
import { TabScreenProvider } from '../src/context/TabScreenContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { shouldShowJourneyTabBar } from '../src/navigation/MainTabNavigator';
import { JourneyChildScreenLayout } from '../src/navigation/JourneyNavigator';

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

jest.mock('../src/navigation/MeNavigator', () => ({
  MeNavigator: () => null,
}));

jest.mock('../src/navigation/TodayNavigator', () => ({
  TodayNavigator: () => null,
}));

jest.mock('../src/screens/journey/ActiveJourneyScreen', () => ({
  ActiveJourneyScreen: () => null,
}));

jest.mock('../src/screens/journey/JourneyDetailScreen', () => ({
  JourneyDetailScreen: () => null,
}));

jest.mock('../src/screens/journey/JourneyScreen', () => ({
  JourneyScreen: () => null,
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe('Journey navigator tab-bar visibility', () => {
  test('shows tabs only on Journey home', () => {
    expect(shouldShowJourneyTabBar()).toBe(true);
    expect(shouldShowJourneyTabBar('JourneyHome')).toBe(true);
    expect(shouldShowJourneyTabBar('JourneyDetail')).toBe(false);
    expect(shouldShowJourneyTabBar('ActiveJourney')).toBe(false);
  });

  test('restores the bottom safe-area inset on Journey child screens', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <ThemeProvider initialMode="dark">
            <TabScreenProvider value>
              <JourneyChildScreenLayout>
                <ScreenContainer>
                  <Text>Child screen</Text>
                </ScreenContainer>
              </JourneyChildScreenLayout>
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
