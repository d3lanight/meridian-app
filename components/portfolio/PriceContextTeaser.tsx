// components/portfolio/PriceContextTeaser.tsx
// v1.0.0 · S165 · Sprint 35
// Free user version: blurred fake sparkline + "Pro" label.
// Replaces the old regime strip teaser.

import { M } from '@/lib/meridian'

export default function PriceContextTeaser() {
  return (
    <div style={{
      marginTop: 10,
      padding: '10px 12px',
      borderRadius: 12,
      background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.04))`,
      border: `1px solid ${M.borderAccent}`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Blurred fake sparkline */}
      <div style={{
        filter: 'blur(4px)', opacity: 0.3,
        pointerEvents: 'none', marginBottom: 6,
      }}>
        <svg width={260} height={28} style={{ display: 'block' }}>
          <polyline
            points="2,20 30,14 60,18 90,10 120,12 150,8 180,15 210,6 240,10 258,4"
            fill="none"
            stroke={M.accent}
            strokeWidth={1.5}
          />
        </svg>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 12, height: 12, borderRadius: 4,
            background: M.accentGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 7, color: 'white', fontWeight: 700 }}>P</span>
          </div>
          <span style={{ fontSize: 9, color: M.textMuted }}>
            Price context · BTC correlation
          </span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 600, color: M.accent }}>Pro</span>
      </div>
    </div>
  )
}
