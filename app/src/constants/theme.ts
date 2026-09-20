export const colors = {
  background: '#0A0A0A',
  surface: '#121212',
  surfaceRaised: '#1A1A1A',
  checked: '#2A2A2A',
  accent: '#FF3D00',
  accentDark: '#2B0C05',
  text: '#FFFFFF',
  textMuted: '#777777',
  textSubtle: '#555555',
  border: '#2A2A2A',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 3,
  },
  heading: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '900' as const,
    letterSpacing: -1,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 3,
  },
  body: {
    color: colors.text,
    fontSize: 15,
  },
} as const;

export const theme = { colors, spacing, typography } as const;
