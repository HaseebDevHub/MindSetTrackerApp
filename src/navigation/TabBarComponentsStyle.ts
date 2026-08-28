import { StyleSheet } from 'react-native';
import { typography, type ThemeColors } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    tabLabel: {
      ...typography.caption,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
