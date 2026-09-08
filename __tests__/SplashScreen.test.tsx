import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemeProvider } from '../src/context/ThemeContext';
import { setSelectedLanguage } from '../src/localization';
import { getInitialRootRoute } from '../src/navigation/RootNavigator';
import {
  SPLASH_DURATION_MS,
  SplashScreen,
} from '../src/screens/splash/SplashScreen';
import { storage } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/storageKeys';
import { useAppStore } from '../src/store/useAppStore';

jest.mock('react-native-reanimated', () => {
  const { View: NativeView } = require('react-native');
  return {
    __esModule: true,
    default: { View: NativeView },
    cancelAnimation: jest.fn(),
    useAnimatedStyle: (factory: () => object) => factory(),
    useSharedValue: (value: unknown) => ({ value }),
    withTiming: (value: unknown) => value,
  };
});

jest.mock('lucide-react-native', () => {
  const { View: NativeView } = require('react-native');
  return new Proxy(
    { __esModule: true },
    {
      get: (target, property) =>
        property === '__esModule' ? target.__esModule : NativeView,
    },
  );
});

jest.mock('../src/navigation/MainTabNavigator', () => ({
  MainTabNavigator: () => null,
}));

jest.mock('../src/navigation/OnboardingNavigator', () => ({
  OnboardingNavigator: () => null,
}));

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 8, 12));
    setSelectedLanguage('English');
    storage.setString(STORAGE_KEYS.APP_STARTED_DATE, '2026-09-08');
    useAppStore.setState({ habits: [], weekStartsOn: 0 });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    storage.remove(STORAGE_KEYS.APP_STARTED_DATE);
  });

  test('routes incomplete users to onboarding and returning users to splash', () => {
    expect(getInitialRootRoute(false)).toBe('Onboarding');
    expect(getInitialRootRoute(true)).toBe('Splash');
  });

  test('renders dynamic content and replaces itself with Main once', () => {
    const navigation = { replace: jest.fn() };
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <SplashScreen
            navigation={navigation as never}
            route={{ key: 'Splash', name: 'Splash' }}
          />
        </ThemeProvider>,
      );
    });

    const text = renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat(Infinity);
    expect(text).toEqual(
      expect.arrayContaining([
        'HABIT TRACKER & GOAL PLANNER',
        'Your day 1 in Mindset Tracker',
        '0 habits finished this week',
      ]),
    );

    act(() => jest.advanceTimersByTime(SPLASH_DURATION_MS));
    expect(navigation.replace).toHaveBeenCalledTimes(1);
    expect(navigation.replace).toHaveBeenCalledWith('Main');
    act(() => renderer!.unmount());
  });

  test('uses light theme colors and RTL text direction', () => {
    setSelectedLanguage('Urdu');
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="light">
          <SplashScreen
            navigation={{ replace: jest.fn() } as never}
            route={{ key: 'Splash-rtl', name: 'Splash' }}
          />
        </ThemeProvider>,
      );
    });

    const page = renderer!.root.findAllByType(View).find(node => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.backgroundColor === '#F6F7FB' && style?.paddingHorizontal;
    });
    const tagline = renderer!.root
      .findAllByType(Text)
      .find(node => node.props.children === 'عادت ٹریکر اور ہدف منصوبہ ساز');
    expect(page).toBeDefined();
    expect(StyleSheet.flatten(tagline!.props.style)).toMatchObject({
      writingDirection: 'rtl',
    });
    act(() => renderer!.unmount());
  });
});
