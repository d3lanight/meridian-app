// ━━━ Meridian Design Tokens ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Centralized token map for inline styles (SVG gradients, etc.)
// Tailwind classes handle most styling via tailwind.config tokens.

export const M = {
  // Backgrounds
  bg: '#0B1120',
  bgGrad: 'linear-gradient(180deg, #0B1120 0%, #0D1526 50%, #0B1120 100%)',
  surface: '#131B2E',
  surfaceHover: '#172036',
  surfaceLight: '#1A2540',
  surfaceElevated: '#16203A',

  // Borders
  border: 'rgba(245, 183, 77, 0.10)',
  borderSubtle: 'rgba(148, 163, 184, 0.08)',

  // Accent
  accent: '#F5B74D',
  accentDim: '#C4923E',
  accentGlow: 'rgba(245, 183, 77, 0.06)',
  accentMuted: 'rgba(245, 183, 77, 0.12)',

  // Semantic
  positive: '#34D399',
  positiveDim: 'rgba(52, 211, 153, 0.12)',
  negative: '#F87171',
  negativeDim: 'rgba(248, 113, 113, 0.12)',
  neutral: '#94A3B8',
  neutralDim: 'rgba(148, 163, 184, 0.10)',

  // Text
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textSubtle: '#475569',
} as const;

