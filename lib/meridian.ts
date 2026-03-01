// ━━━ Meridian Design Tokens ━━━
// v2.0.0 · ca-story66 · 2026-02-21
// Meridian v2: Light/warm theme with glassmorphic surfaces
// Centralized token map for inline styles. Tailwind config mirrors these.

export const M = {
  // Backgrounds
  bg: 'linear-gradient(135deg, #F5F1ED, #E8DED6)',
  bgFlat: '#F5F1ED',
  surface: 'rgba(255,255,255,0.6)',
  surfaceHover: 'rgba(255,255,255,0.8)',
  surfaceLight: '#E8DED6',
  surfaceElevated: 'rgba(255,255,255,0.9)',
  surfaceBlur: 'blur(12px)',

  // Borders
  border: 'rgba(255,255,255,0.8)',
  borderSubtle: '#E8DED6',
  borderAccent: 'rgba(244,162,97,0.2)',
  borderPositive: 'rgba(42,157,143,0.3)',

  // Accent
  accent: '#F4A261',
  accentDeep: '#E76F51',
  accentGradient: 'linear-gradient(90deg, #F4A261, #E76F51)',
  accentDim: 'rgba(244,162,97,0.15)',
  accentMuted: 'rgba(244,162,97,0.12)',
  accentGlow: 'rgba(244,162,97,0.06)',

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
