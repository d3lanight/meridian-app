// ━━━ EntryPosture ━━━
// v1.1.0 · ca-story-design-refresh · Sprint 24

'use client'

import { Shield } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import type { EntryPostureData } from '@/lib/feed-types'

export default function EntryPosture({
  data,
  hidden = false,
}: {
  data: EntryPostureData
  hidden?: boolean
}) {
  return (
    <div
      style={{
        ...card({
          background: `linear-gradient(135deg, ${M.accentDim}, ${M.accentGlow})`,
          border: `1px solid ${M.borderAccent}`,
          padding: '16px 18px',
        }),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: M.accentDim,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Shield size={15} color={M.accent} strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: M.textMuted }}>Portfolio posture</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 22,
                fontWeight: 600,
                color: M.text,
              }}
            >
              {hidden ? '••' : data.score}
            </span>
            <span style={{ fontSize: 11, color: M.positive, fontWeight: 600 }}>{data.label}</span>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.55, margin: 0 }}>
        {hidden
          ? 'Your portfolio alignment is healthy for the current regime.'
          : data.narrative}
      </p>
    </div>
  )
}
