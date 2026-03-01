// ━━━ EntryLearn ━━━
// v1.0.0 · ca-story83 · Sprint 20

'use client'

import { BookOpen, ChevronRight } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import type { EntryLearnData } from '@/lib/feed-types'

export default function EntryLearn({ data }: { data: EntryLearnData }) {
  return (
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
        <p style={{ fontSize: 13, color: M.text, lineHeight: 1.5, margin: 0 }}>{data.text}</p>
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
              cursor: 'pointer',
            }}
          >
            Learn about {data.topic} <ChevronRight size={11} />
          </div>
        )}
      </div>
    </div>
  )
}
