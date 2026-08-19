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

const storageMock = (
  jest.requireMock('@react-native-async-storage/async-storage') as {
    __storageMock: {
      getItem: jest.Mock;
      setItem: jest.Mock;
    };
  }
).__storageMock;

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
    storageMock.getItem.mockReset().mockResolvedValue(null);
    storageMock.setItem.mockReset().mockResolvedValue(undefined);
  });

  test('validates stored theme modes', () => {
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode('light')).toBe(true);
    expect(isThemeMode('something-invalid')).toBe(false);
  });

  test('invalid or failed storage reads safely use dark mode', async () => {
    storageMock.getItem.mockResolvedValueOnce('something-invalid');
    await expect(readStoredThemeMode()).resolves.toBe('dark');

    storageMock.getItem.mockRejectedValueOnce(new Error('storage failed'));
    await expect(readStoredThemeMode()).resolves.toBe('dark');
  });

  test('restores a saved light theme before rendering app content', async () => {
    storageMock.getItem.mockResolvedValueOnce('light');
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );
      await Promise.resolve();
    });

    expect(
      renderer!.root.findByProps({ testID: 'theme-probe' }).props.children,
    ).toBe('light');
    act(() => renderer!.unmount());
  });

  test('switches the active palette immediately and persists the choice', async () => {
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

    await act(async () => {
      probe.props.onPress();
      await Promise.resolve();
    });

    probe = renderer!.root.findByProps({ testID: 'theme-probe' });
    expect(probe.props.children).toBe('light');
    expect(probe.props.style).toMatchObject({
      color: lightColors.text,
      backgroundColor: lightColors.background,
    });
    expect(storageMock.setItem).toHaveBeenLastCalledWith('themeMode', 'light');

    act(() => renderer!.unmount());
  });
});
