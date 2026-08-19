import { StyleSheet } from 'react-native';
import {
  radii,
  spacing,
  typography,
  type ThemeColors,
} from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      minHeight: 54,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.surfaceSecondary },
    ghost: { backgroundColor: colors.transparent },
    label: { ...typography.bodyLarge, color: colors.text, letterSpacing: 0.6 },
    primaryLabel: { color: colors.onPrimary },
    ghostLabel: { color: colors.textSecondary },
    pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
    disabled: { opacity: 0.45 },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
