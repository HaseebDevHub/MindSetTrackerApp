export const colors = {
  primary: '#3B82F6',
  selectedBlue: '#2563EB',
  darkBlue: '#1D4ED8',
  background: '#12161E',
  surface: '#1E232E',
  surfaceSecondary: '#252A34',
  divider: '#2A2F3D',
  text: '#FFFFFF',
  textSecondary: '#A0AEC0',
  muted: '#4A5568',
  tabMuted: '#717D96',
  red: '#EF4444',
  yellow: '#F59E0B',
  green: '#10B981',
  overlay: 'rgba(5, 8, 13, 0.78)',
  transparent: 'transparent',
} as const;

export const spacing = {
  screen: 20,
  card: 16,
  xs: 4,
  small: 8,
  medium: 12,
  large: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = { card: 16, button: 12, pill: 27, small: 10 } as const;

export const typography = {
  headingXL: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  headingL: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  headingM: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  metric: { fontSize: 36, lineHeight: 42, fontWeight: '800' as const },
} as const;

export const theme = { colors, spacing, radii, typography } as const;
