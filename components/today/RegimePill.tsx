// ━━━ RegimePill ━━━ v1.0.0 · S161
'use client'
import { M } from '@/lib/meridian'

const REGIME_CONFIG: Record<string, { icon: string; color: string; dim: string; label: string }> = {
  bull: { icon: '↗', color: M.positive, dim: M.positiveDim, label: 'Bull' },
  bear: { icon: '↘', color: M.negative, dim: M.negativeDim, label: 'Bear' },
  range: { icon: '→', color: M.neutral, dim: 'rgba(139,117,101,0.1)', label: 'Range' },
  volatility: { icon: '↕', color: M.volatility, dim: M.volatilityDim, label: 'Volatile' },
}

interface RegimePillProps {
  regime: string
  confidence: number
  day: number
}

export default function RegimePill({ regime, confidence, day }: RegimePillProps) {
  const r = REGIME_CONFIG[regime] || REGIME_CONFIG.range
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 20,
      background: r.dim, border: `1px solid ${r.color}22`,
    }}>
      <span style={{ fontSize: 14, color: r.color }}>{r.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.label}</span>
      <span style={{ fontSize: 10, color: M.textMuted }}>· Day {day} · {confidence}%</span>
    </div>
  )
}
