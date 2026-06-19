export const colors = {
  // Base surfaces
  bg: '#04050A',
  surface: '#0B0D14',
  surface2: '#12151F',
  surface3: '#181C28',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // Typography
  text: '#E9ECF4',
  textSecondary: '#8B92A4',
  textSubtle: '#5C6275',
  textDisabled: '#3A3F50',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',

  // Glass
  glass: 'rgba(255,255,255,0.04)',
  glassStrong: 'rgba(255,255,255,0.07)',

  // Transparent
  transparent: 'transparent',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const typography = {
  // Display — hero moments
  displayLg: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -1.5, lineHeight: 40 },
  displayMd: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -1, lineHeight: 34 },

  // Headings
  headingLg: { fontSize: 24, fontWeight: '600' as const, letterSpacing: -0.8, lineHeight: 30 },
  headingMd: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.5, lineHeight: 26 },
  headingSm: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.3, lineHeight: 22 },

  // Body
  bodyLg: { fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.1, lineHeight: 24 },
  bodyMd: { fontSize: 14, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 21 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 19 },

  // Labels / Caps
  labelLg: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 1.2, lineHeight: 16 },
  labelMd: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.0, lineHeight: 14 },
  labelSm: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.8, lineHeight: 13 },

  // Quote / Oath
  oath: { fontSize: 20, fontWeight: '400' as const, fontStyle: 'italic' as const, letterSpacing: -0.3, lineHeight: 30 },
} as const;

export const shadows = {
  glow: (color: string, radius = 24) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: radius,
    elevation: 12,
  }),
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
