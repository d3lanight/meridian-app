// ━━━ EmptyPortfolioCTA ━━━
// v1.1.0 · ca-story-design-refresh · Sprint 24
// Shown when authenticated user has no portfolio data

'use client'

import { Wallet } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

export default function EmptyPortfolioCTA() {
  return (
    <div
      style={{
        ...card({
          padding: '20px 18px',
          background: `linear-gradient(135deg, ${M.accentDim}, ${M.accentGlow})`,
          border: `1px solid ${M.borderAccent}`,
        }),
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: M.accentDim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Wallet size={17} color={M.accent} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: M.text, marginBottom: 4 }}>
          Add your holdings
        </div>
        <p style={{ fontSize: 13, color: M.textSecondary, lineHeight: 1.5, margin: '0 0 10px' }}>
          Meridian can show how your portfolio aligns with the current market regime. Add your holdings to unlock posture scoring and personal insights.
        </p>
        <a
          href="/portfolio"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 600,
            color: M.accent,
            textDecoration: 'none',
          }}
        >
          Go to Portfolio →
        </a>
      </div>
    </div>
  )
}
