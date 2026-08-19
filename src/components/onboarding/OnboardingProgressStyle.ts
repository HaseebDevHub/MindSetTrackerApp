import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants/theme';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.small,
    marginVertical: spacing.large,
  },
  segment: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    backgroundColor: colors.surfaceSecondary,
  },
  active: { backgroundColor: colors.primary },
});

export default styles;
