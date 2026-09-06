import { StyleSheet } from 'react-native';
import {
  radii,
  spacing,
  typography,
  type ThemeColors,
} from '../../../constants/theme';
import { useThemedStyles } from '../../../hooks/useThemedStyles';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: 285,
      height: 158,
      borderRadius: radii.card,
      overflow: 'hidden',
    },
    image: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: colors.artworkOverlay,
    },
    content: {
      flex: 1,
      padding: spacing.large,
      justifyContent: 'space-between',
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowRTL: { flexDirection: 'row-reverse' },
    textRTL: { textAlign: 'right', writingDirection: 'rtl' },
    titleRTL: { alignSelf: 'flex-end' },
    progressTrackRTL: { alignItems: 'flex-end' },
    status: {
      ...typography.caption,
      color: colors.onPrimary,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    percentage: {
      ...typography.bodyLarge,
      color: colors.onPrimary,
    },
    title: {
      ...typography.headingM,
      color: colors.onPrimary,
      maxWidth: '82%',
    },
    progressTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.onPrimaryFaint,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 3 },
    progressCopy: {
      ...typography.caption,
      color: colors.onPrimaryMuted,
    },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
