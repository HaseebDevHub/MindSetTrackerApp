import { StyleSheet } from 'react-native';
import { typography, type ThemeColors } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tabBar: {
      height: 66,
      paddingTop: 7,
      paddingBottom: 7,
      backgroundColor: colors.tabBar,
      borderTopColor: colors.divider,
    },
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
