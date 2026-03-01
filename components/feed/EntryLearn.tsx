// ━━━ EntryLearn ━━━
// v2.0.0 · ca-story85 · Sprint 20
// Tap to expand full summary text

'use client'

import { useState } from 'react'
import { BookOpen, ChevronRight, ChevronDown } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import type { EntryLearnData } from '@/lib/feed-types'

export default function EntryLearn({ data }: { data: EntryLearnData }) {
  const [expanded, setExpanded] = useState(false)

  // Truncate to ~120 chars for collapsed view
  const isLong = data.text.length > 120
  const displayText = expanded || !isLong ? data.text : data.text.slice(0, 120) + '…'

  return (
    <div
      onClick={() => isLong && setExpanded(!expanded)}
      style={{
        ...card({ padding: '14px 16px' }),
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        cursor: isLong ? 'pointer' : 'default',
        transition: 'background 0.15s ease',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'rgba(42,157,143,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <BookOpen size={14} color={M.positive} strokeWidth={2} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, color: M.text, lineHeight: 1.5, margin: 0 }}>{displayText}</p>
        {data.topic && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 6,
              fontSize: 11,
              color: M.positive,
              fontWeight: 500,
            }}
          >
            Learn about {data.topic}{' '}
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </div>
        )}
      </div>
    </div>
  )
}
