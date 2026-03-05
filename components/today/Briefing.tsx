// ━━━ Briefing ━━━ v1.0.0 · S161
'use client'
import { Sparkles } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

const REGIME_COLORS: Record<string, { icon: string; color: string }> = {
  bull: { icon: '↗', color: M.positive },
  bear: { icon: '↘', color: M.negative },
  range: { icon: '→', color: M.neutral },
  volatility: { icon: '↕', color: M.volatility },
}

interface BriefingProps {
  regime: string
  regimeDay: number
  confidence: number
  postureLabel: string
  portfolioNote: string
}

export default function Briefing({ regime, regimeDay, confidence, postureLabel, portfolioNote }: BriefingProps) {
  const r = REGIME_COLORS[regime] || REGIME_COLORS.range
  const postureColor = postureLabel === 'Aligned' ? M.positive : postureLabel === 'Misaligned' ? M.negative : M.neutral

  return (
    <div style={{
      ...card({ padding: 18 }),
      background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.04))`,
      border: `1px solid ${M.borderAccent}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 10,
          background: M.accentDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={14} color={M.accent} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: M.text }}>Your briefing</span>
        <span style={{ fontSize: 9, color: M.textMuted, marginLeft: 'auto' }}>Updated just now</span>
      </div>
      <p style={{ fontSize: 14, color: M.text, lineHeight: 1.65, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
        Markets are in a <span style={{ fontWeight: 600, color: r.color }}>{regime} regime</span> (day {regimeDay}, {confidence}% confidence).
        Your portfolio is <span style={{ fontWeight: 600, color: postureColor }}>{postureLabel.toLowerCase()}</span>.
        {' '}{portfolioNote}
      </p>
    </div>
  )
}
