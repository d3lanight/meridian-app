// ━━━ Shared UI Helpers ━━━
// v1.0.0 · ca-story78 · Sprint 19
// Extracted from dashboard, market, portfolio pages

import { M } from '@/lib/meridian'

// ── Card ──────────────────────────────────────

export const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: M.surface,
  backdropFilter: M.surfaceBlur,
  WebkitBackdropFilter: M.surfaceBlur,
  borderRadius: '24px',
  padding: '20px',
  border: `1px solid ${M.border}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  ...extra,
})

// ── Regime Icon Background ────────────────────

export function regimeIconBg(regime: string): string {
  const r = regime.toLowerCase()
  if (r.includes('bull')) return 'linear-gradient(135deg, #2A9D8F, rgba(42,157,143,0.8))'
  if (r.includes('bear')) return 'linear-gradient(135deg, #E76F51, rgba(231,111,81,0.8))'
  if (r.includes('volat')) return 'linear-gradient(135deg, #D4A017, rgba(212,160,23,0.8))'
  return 'linear-gradient(135deg, #F4A261, rgba(244,162,97,0.8))'
}

// ── Regime Narrative ──────────────────────────

export function regimeNarrative(regime: string): string {
  const r = regime.toLowerCase()
  if (r.includes('bull'))
    return 'Upward momentum within a defined range. Breakout potential exists, though volatility remains contained.'
  if (r.includes('bear'))
    return 'Downward pressure with elevated volatility. Capital is consolidating into safer positions.'
  if (r.includes('volat'))
    return 'Elevated price swings without clear direction. Risk management takes priority in this environment.'
  return 'Market moving sideways with no clear directional bias. Consolidation phase with moderate activity.'
}

// ── Posture Narrative ─────────────────────────

export function postureNarrative(posture: string, regime: string): string {
  if (posture === 'Aligned')
    return `Your holdings show moderate alignment with the current ${regime.toLowerCase()} regime. Portfolio exposure is within expected range.`
  if (posture === 'Watch' || posture === 'Moderate')
    return 'Your holdings are drifting from regime targets. Monitor allocation for potential rebalancing.'
  if (posture === 'Misaligned')
    return "Your holdings diverge significantly from the current regime's recommended allocation."
  return 'Add holdings to see portfolio posture analysis.'
}

// ── Stagger Animation ─────────────────────────
// Usage: style={anim(mounted, 0)} for first card, anim(mounted, 1) for second, etc.

export const anim = (mounted: boolean, i: number): React.CSSProperties => ({
  opacity: mounted ? 1 : 0,
  transform: mounted ? 'translateY(0)' : 'translateY(12px)',
  transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
})
