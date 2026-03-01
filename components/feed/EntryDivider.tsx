// ━━━ EntryDivider ━━━
// v1.0.0 · ca-story83 · Sprint 20

'use client'

import { M } from '@/lib/meridian'
import type { EntryDividerData } from '@/lib/feed-types'

export default function EntryDivider({ data }: { data: EntryDividerData }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '4px 0',
      }}
    >
      <div style={{ flex: 1, height: 1, background: M.borderSubtle }} />
      <span
        style={{
          fontSize: 9,
          color: M.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 500,
        }}
      >
        {data.label}
      </span>
      <div style={{ flex: 1, height: 1, background: M.borderSubtle }} />
    </div>
  )
}
