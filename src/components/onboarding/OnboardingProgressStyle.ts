import { StyleSheet } from 'react-native';
import { spacing, type ThemeColors } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.small,
      marginVertical: spacing.large,
    },
    segment: {
      height: 4,
      flex: 1,
      borderRadius: 2,
      backgroundColor: colors.surfaceSecondary,
    },
    active: { backgroundColor: colors.primary },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
