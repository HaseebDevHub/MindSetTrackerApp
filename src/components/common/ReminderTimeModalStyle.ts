import { StyleSheet } from 'react-native';
import { spacing, typography, type ThemeColors } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
    },
    backdropDismissArea: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    sheet: {
      paddingHorizontal: spacing.screen,
      paddingTop: spacing.small,
      paddingBottom: 38,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: colors.surface,
    },
    handle: {
      width: 42,
      height: 4,
      alignSelf: 'center',
      borderRadius: 2,
      backgroundColor: colors.muted,
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.headingM,
      color: colors.text,
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.medium,
    },
    action: { flex: 1 },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
