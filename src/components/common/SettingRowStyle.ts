import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../../constants/theme';

const styles = StyleSheet.create({
  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    padding: spacing.medium,
    borderRadius: radii.button,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25344A',
  },
  copy: { flex: 1 },
  title: { ...typography.bodyLarge, color: colors.text },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pressed: { opacity: 0.75 },
});

export default styles;
