import { StyleSheet } from 'react-native';
import { spacing, typography, type ThemeColors } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    page: {
      flex: 1,
      paddingHorizontal: spacing.xxl,
      backgroundColor: colors.background,
    },
    tagline: {
      ...typography.bodyLarge,
      color: colors.text,
      textAlign: 'center',
      marginTop: 56,
      letterSpacing: 0.6,
    },
    logoArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: 150,
      height: 150,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoDot: {
      position: 'absolute',
      top: 25,
      right: 18,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.text,
    },
    summary: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    summaryRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.medium,
    },
    summaryLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
    },
    summaryText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    weeklyText: {
      ...typography.bodyLarge,
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.small,
    },
    textRTL: {
      writingDirection: 'rtl',
    },
    progressTrack: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      backgroundColor: colors.surfaceSecondary,
      marginBottom: spacing.xxl,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
