import { StyleSheet } from 'react-native';
import { spacing, type ThemeColors } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tabBar: {
      height: 66,
      paddingTop: 7,
      paddingBottom: 7,
      paddingHorizontal: spacing.small,
      backgroundColor: colors.tabBar,
      borderTopWidth: 0,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      shadowOpacity: 0,
      elevation: 0,
    },
    tabItem: { paddingVertical: 2 },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
