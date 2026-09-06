import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { GeneralSettingsScreen } from '../src/screens/me/GeneralSettingsScreen';
import { useAppStore } from '../src/store/useAppStore';
import { storage } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/storageKeys';
import { setSelectedLanguage } from '../src/localization';

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

function ModeProbe() {
  const { mode } = useTheme();
  return <Text testID="mode-probe">{mode}</Text>;
}

describe('General Settings appearance', () => {
  afterEach(() => {
    setSelectedLanguage('English');
    storage.remove(STORAGE_KEYS.GENERAL_WEEK_START);
    useAppStore.setState({ weekStartsOn: 0 });
  });

  test('mirrors the Me settings layout when Urdu is selected', () => {
    setSelectedLanguage('Urdu');
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <GeneralSettingsScreen
            navigation={{ goBack: jest.fn() } as never}
            route={{ key: 'GeneralSettings', name: 'GeneralSettings' }}
          />
        </ThemeProvider>,
      );
    });

    const appearanceRow = renderer!.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        node.props.accessibilityLabel === 'ظاہری شکل',
    )[0];
    const rowStyle =
      typeof appearanceRow.props.style === 'function'
        ? appearanceRow.props.style({ pressed: false })
        : appearanceRow.props.style;
    expect(StyleSheet.flatten(rowStyle)).toMatchObject({
      flexDirection: 'row-reverse',
    });

    const appearanceText = renderer!.root
      .findAllByType(Text)
      .find(node => node.props.children === 'ظاہری شکل');
    expect(StyleSheet.flatten(appearanceText!.props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
    });
    expect(
      renderer!.root.findAllByType(View).some(node => {
        const style = StyleSheet.flatten(node.props.style);
        return (
          style?.minHeight === 52 && style?.flexDirection === 'row-reverse'
        );
      }),
    ).toBe(true);

    act(() => renderer!.unmount());
  });

  test('selecting Light updates the global mode and Appearance subtitle', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <GeneralSettingsScreen
            navigation={{ goBack: jest.fn() } as never}
            route={{ key: 'GeneralSettings', name: 'GeneralSettings' }}
          />
          <ModeProbe />
        </ThemeProvider>,
      );
    });

    const appearance = renderer!.root.findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        node.props.accessibilityLabel === 'Appearance',
    )[0];
    act(() => appearance.props.onPress());

    const lightOption = renderer!.root.findAll(
      node =>
        node.props.accessibilityRole === 'radio' &&
        node.props.accessibilityLabel === 'Light theme',
    )[0];
    act(() => lightOption.props.onPress());

    expect(
      renderer!.root.findByProps({ testID: 'mode-probe' }).props.children,
    ).toBe('light');
    expect(
      renderer!.root
        .findAllByType(Text)
        .some(node => node.props.children === 'Light'),
    ).toBe(true);

    act(() => renderer!.unmount());
  });

  test('persists and exposes the selected week start', () => {
    useAppStore.setState({ weekStartsOn: 0 });
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <GeneralSettingsScreen
            navigation={{ goBack: jest.fn() } as never}
            route={{ key: 'GeneralSettings', name: 'GeneralSettings' }}
          />
        </ThemeProvider>,
      );
    });

    const monday = renderer!.root.findByProps({
      accessibilityLabel: 'Monday week start',
    });
    act(() => monday.props.onPress());

    expect(useAppStore.getState().weekStartsOn).toBe(1);
    expect(storage.getNumber(STORAGE_KEYS.GENERAL_WEEK_START)).toBe(1);
    expect(
      renderer!.root.findByProps({
        accessibilityLabel: 'Monday week start',
      }).props.accessibilityState,
    ).toEqual({ checked: true });

    act(() => renderer!.unmount());
  });
});
