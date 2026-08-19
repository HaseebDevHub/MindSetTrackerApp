import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../../constants/theme';

const styles = StyleSheet.create({
  wrap: { gap: spacing.small },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    ...typography.bodyLarge,
    minHeight: 52,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceSecondary,
    color: colors.text,
    paddingHorizontal: spacing.large,
  },
  multiline: {
    height: 132,
    paddingTop: spacing.large,
    textAlignVertical: 'top',
  },
});

export default styles;
