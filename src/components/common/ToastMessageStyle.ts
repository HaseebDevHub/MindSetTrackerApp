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
    overlay: {
      position: 'absolute',
      top: spacing.medium,
      left: spacing.screen,
      right: spacing.screen,
      zIndex: 100,
      elevation: 20,
      alignItems: 'center',
    },
    toast: {
      width: '100%',
      maxWidth: 420,
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.medium,
      paddingHorizontal: spacing.large,
      borderRadius: radii.button,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 12,
    },
    success: { backgroundColor: colors.green },
    error: { backgroundColor: colors.red },
    info: { backgroundColor: colors.primary },
    message: {
      ...typography.bodyLarge,
      flex: 1,
      color: colors.onPrimary,
      fontWeight: '700',
    },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
