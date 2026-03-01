// ━━━ EntryInsight ━━━
// v1.1.0 · ca-story93 · Sprint 24
// Pro-gated: first insight free, rest locked for free users

'use client'

import { Zap, Shield, TrendingUp, Activity, ChevronRight } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import { ProGate } from '@/components/shared/ProGate'
import type { EntryInsightData } from '@/lib/feed-types'

const ICONS = {
  zap: Zap,
  shield: Shield,
  trending: TrendingUp,
  activity: Activity,
} as const

const ICON_STYLES = {
  accent: { bg: M.accentDim, color: M.accent },
  positive: { bg: M.positiveDim, color: M.positive },
  eth: { bg: 'rgba(98,126,234,0.1)', color: '#627EEA' },
  neutral: { bg: M.neutralDim, color: M.neutral },
} as const

interface EntryInsightProps {
  data: EntryInsightData
  locked?: boolean
}

export default function EntryInsight({ data, locked = false }: EntryInsightProps) {
  const Icon = ICONS[data.icon] ?? Zap
  const style = ICON_STYLES[data.iconVariant] ?? ICON_STYLES.accent

  const content = (
    <div
      style={{
        ...card({ padding: '14px 16px' }),
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: style.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Icon size={15} color={style.color} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: M.text, lineHeight: 1.5, margin: 0 }}>{data.text}</p>
        {data.subtext && (
          <p style={{ fontSize: 11, color: M.textMuted, lineHeight: 1.4, margin: '4px 0 0' }}>
            {data.subtext}
          </p>
        )}
      </div>
      {data.link && (
        <ChevronRight
          size={14}
          color={M.textMuted}
          style={{ flexShrink: 0, marginTop: 4 }}
        />
      )}
    </div>
  )

  if (locked) {
    return <ProGate isPro={false} label="More insights with Pro">{content}</ProGate>
  }

  return content
}
