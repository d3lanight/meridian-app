// ━━━ IntradaySignals ━━━ v1.0.0 · S162
// Mock data — wired when S147 n8n pipeline exists
'use client'
import { Lock, Zap } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

const RC: Record<string, { label: string; icon: string; color: string; dim: string; bg: string }> = {
  bull: { label: 'Bull', icon: '↗', color: M.positive, dim: M.positiveDim, bg: 'linear-gradient(135deg,#2A9D8F,#3DB8A9)' },
  bear: { label: 'Bear', icon: '↘', color: M.negative, dim: M.negativeDim, bg: 'linear-gradient(135deg,#E76F51,#F08C70)' },
  range: { label: 'Range', icon: '→', color: M.neutral, dim: 'rgba(139,117,101,0.1)', bg: 'linear-gradient(135deg,#8B7565,#A08B7B)' },
  volatility: { label: 'Volatile', icon: '↕', color: M.volatility, dim: M.volatilityDim, bg: 'linear-gradient(135deg,#D4A017,#E0B030)' },
}

interface Signal { time: string; regime: string; confidence: number }
interface IntradaySignalsProps { isPro: boolean }

const MOCK_SIGNALS: Signal[] = [
  { time: '00:00', regime: 'bull', confidence: 71 },
  { time: '04:00', regime: 'bull', confidence: 68 },
  { time: '08:00', regime: 'range', confidence: 55 },
  { time: '12:00', regime: 'bull', confidence: 63 },
  { time: '16:00', regime: 'bull', confidence: 72 },
  { time: '20:00', regime: 'bull', confidence: 74 },
]

export default function IntradaySignals({ isPro }: IntradaySignalsProps) {
  if (!isPro) {
    return (
      <div style={{
        ...card({ padding: 16, borderRadius: 16 }),
        background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.06))`,
        border: `1px solid ${M.borderAccent}`, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: M.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock size={16} color={M.accent} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>Intraday Regime Signals</div>
            <div style={{ fontSize: 11, color: M.textMuted, marginTop: 2 }}>See how the market regime shifts throughout the day. Pro feature.</div>
          </div>
        </div>
      </div>
    )
  }

  const signals = MOCK_SIGNALS
  return (
    <div style={{ ...card({ padding: 16 }), marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Zap size={16} color={M.accent} />
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600, color: M.text }}>Intraday Regime Signals</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: M.accent, background: M.accentDim, padding: '2px 6px', borderRadius: 6 }}>PRO</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {signals.map((s, i) => {
          const rc = RC[s.regime] || RC.range
          const isNow = i === signals.length - 1
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              borderRadius: 10,
              background: isNow ? rc.dim : 'transparent',
              border: isNow ? `1px solid ${rc.color}22` : '1px solid transparent',
            }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: M.textMuted, width: 42, flexShrink: 0 }}>{s.time}</span>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                background: isNow ? rc.bg : rc.dim,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 10, color: isNow ? 'white' : rc.color, fontWeight: 700 }}>{rc.icon}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: isNow ? 600 : 400, color: isNow ? M.text : M.textSecondary, flex: 1 }}>{rc.label}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: isNow ? rc.color : M.textMuted, fontWeight: 600 }}>{s.confidence}%</span>
              {isNow && <div style={{ width: 5, height: 5, borderRadius: '50%', background: rc.color, boxShadow: `0 0 6px ${rc.color}`, flexShrink: 0 }} />}
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 10, color: M.textMuted, marginTop: 10, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
        Regime classification snapshots taken every 4 hours. Shows intraday momentum shifts.
      </p>
    </div>
  )
}
