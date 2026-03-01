// ━━━ EntryRegime ━━━
// v1.0.0 · ca-story83 · Sprint 20

'use client'

import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import { getRegimeConfig } from '@/lib/regime-utils'
import RegimeIcon from '@/components/shared/RegimeIcon'
import type { EntryRegimeData } from '@/lib/feed-types'

export default function EntryRegime({ data }: { data: EntryRegimeData }) {
  const rc = getRegimeConfig(data.regime)

  return (
    <div
      style={{
        ...card({
          background: 'linear-gradient(135deg, rgba(42,157,143,0.08), rgba(42,157,143,0.03))',
          border: `1px solid ${M.borderPositive}`,
          padding: '16px 18px',
        }),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: rc.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 12px rgba(42,157,143,0.25)',
          }}
        >
          <RegimeIcon regime={data.regime} size={18} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: M.textMuted, marginBottom: 1 }}>Market regime</div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 20,
              fontWeight: 600,
              color: M.text,
            }}
          >
            {rc.l}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 16,
              fontWeight: 600,
              color: M.text,
            }}
          >
            {Math.round(data.confidence * 100)}%
          </div>
          <div style={{ fontSize: 9, color: M.textMuted }}>confidence</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.55, margin: 0 }}>
        {data.narrative}
      </p>
    </div>
  )
}
