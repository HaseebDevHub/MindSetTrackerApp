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
    card: {
      minHeight: 84,
      borderRadius: radii.card,
      padding: spacing.large,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.medium,
    },
    checkbox: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: colors.onPrimary,
      backgroundColor: colors.onPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.small,
    },
    title: { ...typography.bodyLarge, color: colors.onPrimary, flex: 1 },
    completedTitle: {
      textDecorationLine: 'line-through',
      color: colors.onPrimaryMuted,
    },
    time: {
      ...typography.caption,
      color: colors.onPrimaryMuted,
      marginTop: spacing.xs,
      letterSpacing: 0.5,
    },
    finished: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    finishedText: { ...typography.caption, color: colors.onPrimaryFaint },
    menu: {
      width: 34,
      minHeight: 44,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
