export type ThemeMode = 'dark' | 'light';

export type ThemeColors = {
  primary: string;
  selectedBlue: string;
  darkBlue: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  divider: string;
  text: string;
  textSecondary: string;
  muted: string;
  tabMuted: string;
  red: string;
  yellow: string;
  green: string;
  overlay: string;
  transparent: string;
  onPrimary: string;
  onPrimaryMuted: string;
  onPrimarySubtle: string;
  onPrimaryFaint: string;
  completedHabitForeground: string;
  completedHabitText: string;
  completedHabitStatus: string;
  iconSurface: string;
  tabBar: string;
  shadow: string;
  infoSurface: string;
  heroBackground: string;
  heroGlow: string;
  heroBorder: string;
  benefitIconBackground: string;
  premiumSurface: string;
  premiumBorder: string;
  artworkIconSurface: string;
  artworkOverlay: string;
};

export const darkColors: ThemeColors = {
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
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#D9E7FF',
  onPrimarySubtle: 'rgba(255,255,255,0.78)',
  onPrimaryFaint: '#BFDBFE',
  completedHabitForeground: '#FFFFFF',
  completedHabitText: '#D9E7FF',
  completedHabitStatus: '#BFDBFE',
  iconSurface: '#25344A',
  tabBar: '#1A1D24',
  shadow: '#000000',
  infoSurface: '#17243C',
  heroBackground: '#17243C',
  heroGlow: '#1E4A8A',
  heroBorder: '#6EA8FF',
  benefitIconBackground: '#1A304D',
  premiumSurface: '#3A321D',
  premiumBorder: '#675625',
  artworkIconSurface: 'rgba(255,255,255,0.17)',
  artworkOverlay: 'rgba(10,14,22,0.38)',
};

export const lightColors: ThemeColors = {
  primary: '#2563EB',
  selectedBlue: '#2563EB',
  darkBlue: '#1D4ED8',
  background: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF1F6',
  divider: '#D9DEE8',
  text: '#172033',
  textSecondary: '#526076',
  muted: '#7B879A',
  tabMuted: '#7A8496',
  red: '#DC2626',
  yellow: '#B45309',
  green: '#047857',
  overlay: 'rgba(15, 23, 42, 0.46)',
  transparent: 'transparent',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#EAF2FF',
  onPrimarySubtle: 'rgba(255,255,255,0.86)',
  onPrimaryFaint: '#DBEAFE',
  completedHabitForeground: '#526076',
  completedHabitText: '#334155',
  completedHabitStatus: '#2563EB',
  iconSurface: '#E8F0FC',
  tabBar: '#FFFFFF',
  shadow: '#0F172A',
  infoSurface: '#EAF2FF',
  heroBackground: '#E9F1FF',
  heroGlow: '#93B4F6',
  heroBorder: '#4F82E8',
  benefitIconBackground: '#E4EEFF',
  premiumSurface: '#FFF7DD',
  premiumBorder: '#E9CF78',
  artworkIconSurface: 'rgba(255,255,255,0.22)',
  artworkOverlay: 'rgba(10,14,22,0.38)',
};

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

export const darkTheme = {
  colors: darkColors,
  spacing,
  radii,
  typography,
} as const;

export const lightTheme = {
  colors: lightColors,
  spacing,
  radii,
  typography,
} as const;

export type AppTheme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
};

// Kept as the unchanged default palette for non-rendering utilities and tests.
export const colors = darkColors;
export const theme = darkTheme;
