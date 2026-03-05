// ━━━ RegimeHero ━━━ v1.0.0 · S162
'use client'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

const RC: Record<string, { label: string; icon: string; color: string; dim: string; glow: string; bg: string }> = {
  bull: { label: 'Bull', icon: '↗', color: M.positive, dim: M.positiveDim, glow: 'rgba(42,157,143,0.3)', bg: 'linear-gradient(135deg,#2A9D8F,#3DB8A9)' },
  bear: { label: 'Bear', icon: '↘', color: M.negative, dim: M.negativeDim, glow: 'rgba(231,111,81,0.3)', bg: 'linear-gradient(135deg,#E76F51,#F08C70)' },
  range: { label: 'Range', icon: '→', color: M.neutral, dim: 'rgba(139,117,101,0.1)', glow: 'rgba(139,117,101,0.2)', bg: 'linear-gradient(135deg,#8B7565,#A08B7B)' },
  volatility: { label: 'Volatile', icon: '↕', color: M.volatility, dim: M.volatilityDim, glow: 'rgba(212,160,23,0.3)', bg: 'linear-gradient(135deg,#D4A017,#E0B030)' },
}

interface RegimeHeroProps { regime: string; confidence: number; persistence: number }

export default function RegimeHero({ regime, confidence, persistence }: RegimeHeroProps) {
  const rc = RC[regime] || RC.range
  return (
    <div style={{
      ...card({ padding: 0 }),
      background: `linear-gradient(135deg, ${rc.dim}, rgba(255,255,255,0.4))`,
      border: `1px solid ${rc.color}33`, overflow: 'hidden', marginBottom: 12,
    }}>
      <div style={{ padding: '18px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, background: rc.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 16px ${rc.glow}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 24, color: 'white' }}>{rc.icon}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 600, color: M.text }}>{rc.label}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: rc.dim, color: rc.color }}>Day {persistence}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: rc.color }}>{confidence}%</span>
            <span style={{ fontSize: 11, color: M.textMuted }}>confidence</span>
          </div>
        </div>
      </div>
      <div style={{ height: 4, background: M.surfaceLight }}>
        <div style={{ height: '100%', width: `${confidence}%`, background: rc.bg, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}
