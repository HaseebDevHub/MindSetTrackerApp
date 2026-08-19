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
    row: {
      minHeight: 62,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.medium,
      padding: spacing.medium,
      borderRadius: radii.button,
      backgroundColor: colors.surface,
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.iconSurface,
    },
    copy: { flex: 1 },
    title: { ...typography.bodyLarge, color: colors.text },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    pressed: { opacity: 0.75 },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
