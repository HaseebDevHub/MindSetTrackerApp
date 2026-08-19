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
    wrap: { gap: spacing.small },
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    input: {
      ...typography.bodyLarge,
      minHeight: 52,
      borderRadius: radii.button,
      backgroundColor: colors.surfaceSecondary,
      color: colors.text,
      paddingHorizontal: spacing.large,
    },
    multiline: {
      height: 132,
      paddingTop: spacing.large,
      textAlignVertical: 'top',
    },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
