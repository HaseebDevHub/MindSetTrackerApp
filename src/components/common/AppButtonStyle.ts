import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../../constants/theme';

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceSecondary },
  ghost: { backgroundColor: colors.transparent },
  label: { ...typography.bodyLarge, color: colors.text, letterSpacing: 0.6 },
  ghostLabel: { color: colors.textSecondary },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
});

export default styles;
