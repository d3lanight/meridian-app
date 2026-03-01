// ━━━ EntryAnonCta ━━━
// v1.0.0 · ca-story127 · Sprint 26
// Subtle CTA card in feed for anonymous users

import { UserPlus } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import type { EntryAnonCtaData } from '@/lib/feed-types'

interface Props {
  data: EntryAnonCtaData
}

export default function EntryAnonCta({ data }: Props) {
  return (
    <div
      style={{
        ...card({
          background: 'linear-gradient(135deg, rgba(42,157,143,0.06), rgba(42,157,143,0.02))',
          border: `1px solid ${M.borderPositive}`,
          padding: '16px',
        }),
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'rgba(42,157,143,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <UserPlus size={16} color={M.positive} strokeWidth={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: M.text, marginBottom: 4 }}>
            {data.title}
          </div>
          <div style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.5, marginBottom: 12 }}>
            {data.text}
          </div>
          <button
            onClick={() => { window.location.href = '/login' }}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              background: M.positive,
              border: 'none',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Create free account
          </button>
        </div>
      </div>
    </div>
  )
}
