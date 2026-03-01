// ━━━ EntryMarketSnippet ━━━
// v1.0.0 · ca-story83 · Sprint 20

'use client'

import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import type { EntryMarketSnippetData } from '@/lib/feed-types'

export default function EntryMarketSnippet({ data }: { data: EntryMarketSnippetData }) {
  return (
    <div
      style={{
        ...card({ padding: '12px 16px' }),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 13, color: M.textSecondary }}>{data.label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {data.change && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: data.positive ? M.positive : M.negative,
              background: data.positive ? M.positiveDim : M.negativeDim,
              padding: '2px 6px',
              borderRadius: 6,
              fontFamily: "'DM Sans', sans-serif",
              fontFeatureSettings: "'tnum' 1, 'lnum' 1",
            }}
          >
            {data.positive ? '+' : ''}
            {data.change}
          </span>
        )}
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontFeatureSettings: "'tnum' 1, 'lnum' 1",
            fontSize: 14,
            fontWeight: 600,
            color: M.text,
          }}
        >
          {data.value}
        </span>
      </div>
    </div>
  )
}
