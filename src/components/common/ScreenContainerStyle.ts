import { StyleSheet } from 'react-native';
import { spacing, type ThemeColors } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    grow: { flexGrow: 1 },
    padded: { paddingHorizontal: spacing.screen },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
