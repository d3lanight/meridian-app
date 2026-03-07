// components/portfolio/BetaBadge.tsx
// v1.0.0 · S165 · Sprint 35
// BTC correlation badge: β value + severity label.
// Thresholds: ≥1.5 High (volatility amber), ≥0.8 Moderate (accent), ≥0.3 Low (positive teal), <0.3 Minimal

import { M } from '@/lib/meridian'

const FONT_MONO = "'DM Mono', monospace"

interface BetaBadgeProps {
  beta: number
}

export default function BetaBadge({ beta }: BetaBadgeProps) {
  const label = beta >= 1.5 ? 'High' : beta >= 0.8 ? 'Moderate' : beta >= 0.3 ? 'Low' : 'Minimal'
  const color = beta >= 1.5 ? M.volatility : beta >= 0.8 ? M.accent : M.positive
  const bg = beta >= 1.5
    ? 'rgba(212,160,23,0.12)'   // volatilityDim
    : beta >= 0.8
    ? 'rgba(123,111,168,0.18)'  // accentDim
    : 'rgba(42,157,143,0.1)'    // positiveDim

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 10, color: M.textMuted }}>BTC β</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color }}>
        {beta.toFixed(1)}x
      </span>
      <span style={{
        fontSize: 8, fontWeight: 600, color, background: bg,
        padding: '1px 5px', borderRadius: 4,
      }}>
        {label}
      </span>
    </div>
  )
}
