import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import {
  darkTheme,
  lightTheme,
  type AppTheme,
  type ThemeMode,
} from '../constants/theme';

const THEME_STORAGE_KEY = 'themeMode';
const themeStorage = createAsyncStorage('mindset-tracker-preferences');
const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: darkTheme.colors.background },
});

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  colors: AppTheme['colors'];
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

export async function readStoredThemeMode(): Promise<ThemeMode> {
  try {
    const savedMode = await themeStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(savedMode) ? savedMode : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeProvider({
  children,
  initialMode,
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}) {
  const [mode, setMode] = useState<ThemeMode>(initialMode ?? 'dark');
  const [ready, setReady] = useState(Boolean(initialMode));
  const writeQueue = useRef(Promise.resolve());

  useEffect(() => {
    if (initialMode) return;
    let active = true;
    readStoredThemeMode().then(savedMode => {
      if (active) {
        setMode(savedMode);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [initialMode]);

  const setThemeMode = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
    writeQueue.current = writeQueue.current
      .then(() => themeStorage.setItem(THEME_STORAGE_KEY, nextMode))
      .catch(() => undefined);
  }, []);
  const selectedTheme: AppTheme = mode === 'light' ? lightTheme : darkTheme;
  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme: selectedTheme,
      colors: selectedTheme.colors,
      setThemeMode,
    }),
    [mode, selectedTheme, setThemeMode],
  );

  if (!ready) {
    return <View style={styles.loading} />;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = React.useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
