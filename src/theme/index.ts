export const colors = {
  primary: '#0B4D8F',
  primaryDark: '#083A6D',
  accent: '#E67E22',
  background: '#FFFFFF',
  surface: '#F5F7FA',
  text: '#1A1A1A',
  textMuted: '#555555',
  border: '#CCCCCC',
  danger: '#C0392B',
  success: '#1E8449',
  disabled: '#B0B0B0',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  baseSize: 18,
  lineHeightRatio: 1.6,
  weights: {
    regular: '400' as const,
    bold: '700' as const,
  },
};

export const fontScaleSteps = [1.0, 1.25, 1.5, 1.75] as const;
export type FontScale = (typeof fontScaleSteps)[number];
