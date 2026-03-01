// ━━━ ProUpgradeCard ━━━
// v1.2.0 · ca-story115 · Sprint 25
// Tier-aware: rendered conditionally by Profile page (tier === free)
// CTA calls onUpgrade callback (toggles tier in DB during testing phase)

import { Crown } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

interface ProUpgradeCardProps {
  onUpgrade?: () => void
}

export function ProUpgradeCard({ onUpgrade }: ProUpgradeCardProps) {
  return (
    <div
      style={{
        ...card({
          background: 'linear-gradient(135deg, rgba(244,162,97,0.08), rgba(231,111,81,0.05))',
          border: `1px solid ${M.borderAccent}`,
          padding: 18,
        }),
        marginBottom: 20,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: M.accentGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Crown size={16} color="white" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: M.text }}>Meridian Pro</div>
          <div style={{ fontSize: 11, color: M.textMuted }}>Unlock the full picture</div>
        </div>
      </div>

      {/* Feature list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {[
          'Per-coin regime performance',
          'P&L tracking with custom dates',
          'AI-powered portfolio insights',
          '90-day regime timeline (180d, 360d coming)',
        ].map((feature, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                background: M.positiveDim,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 9, color: M.positive, fontWeight: 700 }}>✓</span>
            </div>
            <span style={{ fontSize: 12, color: M.textSecondary }}>{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button
        onClick={onUpgrade}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 14,
          background: M.accentGradient,
          border: 'none',
          color: 'white',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Upgrade to Pro
      </button>
    </div>
  )
}
