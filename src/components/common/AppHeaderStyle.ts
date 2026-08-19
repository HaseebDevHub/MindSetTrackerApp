import { StyleSheet } from 'react-native';
import { typography, type ThemeColors } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { minHeight: 52, flexDirection: 'row', alignItems: 'center' },
    side: { width: 44, minHeight: 44, justifyContent: 'center' },
    right: { alignItems: 'flex-end' },
    title: {
      ...typography.bodyLarge,
      flex: 1,
      color: colors.text,
      textAlign: 'center',
      letterSpacing: 1,
    },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
