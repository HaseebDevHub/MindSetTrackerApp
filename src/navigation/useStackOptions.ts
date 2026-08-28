import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

/** Provides the shared visual and transition options for feature stacks. */
export function useStackOptions() {
  const { colors } = useTheme();

  return useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'slide_from_right' as const,
    }),
    [colors.background],
  );
}
