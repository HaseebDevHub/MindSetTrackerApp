import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import {
  isThemeMode,
  readStoredThemeMode,
  ThemeProvider,
  useTheme,
} from '../src/context/ThemeContext';
import { darkColors, lightColors } from '../src/constants/theme';
import { storage } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/storageKeys';

function ThemeProbe() {
  const { colors, mode, setThemeMode } = useTheme();
  return (
    <Text
      testID="theme-probe"
      onPress={() => setThemeMode(mode === 'dark' ? 'light' : 'dark')}
      style={{ color: colors.text, backgroundColor: colors.background }}
    >
      {mode}
    </Text>
  );
}

describe('global theme', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    storage.remove(STORAGE_KEYS.THEME_MODE);
  });

  test('validates stored theme modes', () => {
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode('light')).toBe(true);
    expect(isThemeMode('something-invalid')).toBe(false);
  });

  test('missing, invalid, or failed storage reads safely use dark mode', () => {
    expect(readStoredThemeMode()).toBe('dark');

    jest.spyOn(storage, 'getString').mockReturnValueOnce('something-invalid');
    expect(readStoredThemeMode()).toBe('dark');

    jest.spyOn(storage, 'getString').mockImplementationOnce(() => {
      throw new Error('storage failed');
    });
    expect(readStoredThemeMode()).toBe('dark');
  });

  test('restores a saved light theme before rendering app content', () => {
    storage.setString(STORAGE_KEYS.THEME_MODE, 'light');
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );
    });

    expect(
      renderer!.root.findByProps({ testID: 'theme-probe' }).props.children,
    ).toBe('light');
    act(() => renderer!.unmount());
  });

  test('switches the active palette immediately and persists the choice', () => {
    const setString = jest.spyOn(storage, 'setString');
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider initialMode="dark">
          <ThemeProbe />
        </ThemeProvider>,
      );
    });

    let probe = renderer!.root.findByProps({ testID: 'theme-probe' });
    expect(probe.props.children).toBe('dark');
    expect(probe.props.style).toMatchObject({
      color: darkColors.text,
      backgroundColor: darkColors.background,
    });

    act(() => {
      probe.props.onPress();
    });

    probe = renderer!.root.findByProps({ testID: 'theme-probe' });
    expect(probe.props.children).toBe('light');
    expect(probe.props.style).toMatchObject({
      color: lightColors.text,
      backgroundColor: lightColors.background,
    });
    expect(setString).toHaveBeenLastCalledWith(
      STORAGE_KEYS.THEME_MODE,
      'light',
    );
    expect(storage.getString(STORAGE_KEYS.THEME_MODE)).toBe('light');

    act(() => renderer!.unmount());
  });

  test('persists dark mode and restores it on the next provider mount', () => {
    storage.setString(STORAGE_KEYS.THEME_MODE, 'light');
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );
    });

    let probe = renderer!.root.findByProps({ testID: 'theme-probe' });
    expect(probe.props.children).toBe('light');

    act(() => probe.props.onPress());
    probe = renderer!.root.findByProps({ testID: 'theme-probe' });
    expect(probe.props.children).toBe('dark');
    expect(storage.getString(STORAGE_KEYS.THEME_MODE)).toBe('dark');

    act(() => renderer!.unmount());
    act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );
    });
    expect(
      renderer!.root.findByProps({ testID: 'theme-probe' }).props.children,
    ).toBe('dark');

    act(() => renderer!.unmount());
  });
});
