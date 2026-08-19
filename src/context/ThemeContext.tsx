import React, {
  createContext,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  darkTheme,
  lightTheme,
  type AppTheme,
  type ThemeMode,
} from '../constants/theme';
import { storage } from '../storage/storage';
import { STORAGE_KEYS } from '../storage/storageKeys';

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

export function readStoredThemeMode(): ThemeMode {
  try {
    const savedMode = storage.getString(STORAGE_KEYS.THEME_MODE);
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
  const [mode, setMode] = useState<ThemeMode>(() =>
    initialMode ?? readStoredThemeMode(),
  );

  const setThemeMode = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
    storage.setString(STORAGE_KEYS.THEME_MODE, nextMode);
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

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = React.useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
