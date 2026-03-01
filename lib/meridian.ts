// ━━━ Meridian Design Tokens ━━━
// v3.0.0 · ca-story-design-refresh · 2026-03-01
// Meridian v3: Cool Stone bg + Indigo Violet accent
// Centralized token map for inline styles. Tailwind config mirrors these.

export const M = {
  // Backgrounds — Cool Stone
  bg: 'linear-gradient(135deg, #F0EFF2, #E4E1E8)',
  bgFlat: '#F0EFF2',
  surface: 'rgba(255,255,255,0.6)',
  surfaceHover: 'rgba(255,255,255,0.8)',
  surfaceLight: '#E4E1E8',
  surfaceElevated: 'rgba(255,255,255,0.9)',
  surfaceBlur: 'blur(12px)',

  // Borders
  border: 'rgba(255,255,255,0.8)',
  borderSubtle: '#E4E1E8',
  borderAccent: 'rgba(90,77,138,0.3)',
  borderPositive: 'rgba(42,157,143,0.3)',

  // Accent — Indigo Violet
  accent: '#7B6FA8',
  accentDeep: '#5A4D8A',
  accentGradient: 'linear-gradient(90deg, #7B6FA8, #5A4D8A)',
  accentDim: 'rgba(123,111,168,0.18)',
  accentMuted: 'rgba(123,111,168,0.12)',
  accentGlow: 'rgba(90,77,138,0.35)',

  // Semantic
  positive: '#2A9D8F',
  positiveDim: 'rgba(42,157,143,0.1)',
  negative: '#E76F51',
  negativeDim: 'rgba(231,111,81,0.1)',
  neutral: '#8B7565',
  neutralDim: 'rgba(139,117,101,0.1)',

  // Volatility regime (amber)
  volatility: '#D4A017',
  volatilityDim: 'rgba(212,160,23,0.12)',
  volatilityGlow: 'rgba(212,160,23,0.06)',

  // Crypto branding
  btcOrange: '#F7931A',
  ethBlue: '#627EEA',
  blue: '#60A5FA',
  purple: '#A78BFA',

  // Text
  text: '#2D2416',
  textSecondary: '#6B5A4A',
  textMuted: '#8B7565',
  textSubtle: '#5C4A3D',
} as const;
