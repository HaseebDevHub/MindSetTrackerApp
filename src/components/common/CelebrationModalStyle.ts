import { StyleSheet } from 'react-native';
import { spacing, typography, type ThemeColors } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.screen,
      backgroundColor: colors.overlay,
      overflow: 'hidden',
    },
    confetti: {
      position: 'absolute',
      top: 0,
      width: 8,
      height: 14,
      borderRadius: 2,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      alignItems: 'center',
      padding: spacing.xl,
      borderRadius: 24,
      backgroundColor: colors.surface,
    },
    close: { alignSelf: 'flex-end' },
    icon: {
      width: 78,
      height: 78,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 39,
      backgroundColor: colors.premiumSurface,
      borderWidth: 1,
      borderColor: colors.premiumBorder,
    },
    congratulations: {
      ...typography.headingL,
      color: colors.text,
      marginTop: spacing.xl,
    },
    subtitle: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '700',
      letterSpacing: 1,
      marginTop: spacing.medium,
    },
    title: {
      ...typography.headingM,
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.small,
    },
    button: { alignSelf: 'stretch', marginTop: spacing.xl },
    link: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
      marginTop: spacing.large,
    },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
