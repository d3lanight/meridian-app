// ProUpgradeCard.tsx
// Profile — Pro upgrade CTA card
// Version: 2.1.0
// Sprint: 36
// Changelog:
//   2.1.0 - Removed "Custom notification thresholds" (not yet built).
//           Added note that Pro feature list grows as features ship.
//           Added hint to use tier toggle below for testing.
//   2.0.0 - Updated feature list to v4 items (S168).
//   1.0.0 - Initial (S87): accent CTA, 4-item feature list.

import { Crown } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

const V4_FEATURES = [
  'Price context + BTC correlation per coin',
  '90-day regime timeline',
  'Intraday regime signals',
]

export function ProUpgradeCard() {
  return (
    <div
      style={{
        ...card({
          background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.04))`,
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
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: M.text,
              fontFamily: FONT_DISPLAY,
            }}
          >
            Meridian Pro
          </div>
          <div style={{ fontSize: 11, color: M.textMuted }}>Unlock the full picture</div>
        </div>
      </div>

      {/* Feature list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        {V4_FEATURES.map((feature, i) => (
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
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 9, color: M.positive, fontWeight: 700 }}>✓</span>
            </div>
            <span style={{ fontSize: 12, color: M.textSecondary, fontFamily: FONT_BODY }}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* Growing list note */}
      <p style={{
        fontSize: 11,
        color: M.textMuted,
        fontFamily: FONT_BODY,
        margin: '0 0 14px',
        paddingLeft: 24,
        fontStyle: 'italic',
      }}>
        More Pro features added as they ship.
      </p>

      {/* CTA button */}
      <button
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
          fontFamily: FONT_BODY,
          boxShadow: `0 4px 16px ${M.accentGlow}`,
          marginBottom: 8,
        }}
      >
        Upgrade to Pro
      </button>

      {/* Test hint */}
      <p style={{
        fontSize: 11,
        color: M.textMuted,
        fontFamily: FONT_BODY,
        margin: 0,
        textAlign: 'center' as const,
      }}>
        Testing? Use the tier toggle in Account settings below.
      </p>
    </div>
  )
}
