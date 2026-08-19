import { StyleSheet } from 'react-native';
import { spacing, typography, type ThemeColors } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

export const ITEM_HEIGHT = 54;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      height: ITEM_HEIGHT * 5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.xl,
    },
    wheelPadding: { paddingVertical: ITEM_HEIGHT * 2 },
    item: {
      width: 88,
      height: ITEM_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemText: { fontSize: 24, color: colors.muted },
    selectedText: { fontSize: 32, fontWeight: '800', color: colors.text },
    colon: {
      ...typography.headingXL,
      color: colors.text,
      marginHorizontal: spacing.small,
    },
    selection: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: ITEM_HEIGHT * 2,
      height: ITEM_HEIGHT,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.primary,
    },
  });

export default function useStyles() {
  return useThemedStyles(createStyles);
}
