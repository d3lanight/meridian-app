// ━━━ EntrySignal ━━━
// v1.1.0 · ca-story-design-refresh · Sprint 24

'use client'

import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import type { EntrySignalData } from '@/lib/feed-types'

const SEVERITY_STYLES = {
  info: {
    bg: M.positiveDim,
    border: M.borderPositive,
    dot: M.positive,
  },
  watch: {
    bg: M.accentDim,
    border: M.borderAccent,
    dot: M.accent,
  },
  action: {
    bg: M.negativeDim,
    border: 'rgba(231,111,81,0.2)',
    dot: M.negative,
  },
} as const

export default function EntrySignal({ data }: { data: EntrySignalData }) {
  const s = SEVERITY_STYLES[data.severity] ?? SEVERITY_STYLES.info

  return (
    <div
      style={{
        ...card({ padding: '14px 16px', background: s.bg, border: `1px solid ${s.border}` }),
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: s.dot,
          flexShrink: 0,
          marginTop: 7,
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: M.text, marginBottom: 3 }}>
          {data.title}
        </div>
        <p style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.5, margin: 0 }}>
          {data.text}
        </p>
        <div style={{ fontSize: 10, color: M.textMuted, marginTop: 4 }}>{data.time}</div>
      </div>
    </div>
  )
}
