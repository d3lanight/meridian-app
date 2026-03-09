// ━━━ AllocationCard ━━━
// v1.1.0 · Sprint 36
// Changelog:
//   v1.1.0 — Remove hardcoded teal background + teal border.
//             Plain glassmorphic card — coin colors carry the visual identity.
//             Teal implied a false positive signal regardless of actual allocation.
//             Regime badge still shows current regime context in header.
//   v1.0.0 · S164 · Sprint 34 — Initial.

'use client'

import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import { getRegimeConfig } from '@/lib/regime-utils'

const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"

interface AllocationRow {
  label: string
  color: string
  gradient?: string
  current: number
}

interface AllocationCardProps {
  allocations: AllocationRow[]
  regime: string
  hidden?: boolean
}

export function buildAllocations(
  btcWeight: number,
  ethWeight: number,
  altWeight: number,
  stableWeight: number,
): AllocationRow[] {
  return [
    { label: 'BTC',    color: M.btcOrange, current: Math.round(btcWeight    * 100) },
    { label: 'ETH',    color: M.ethBlue,   current: Math.round(ethWeight    * 100) },
    { label: 'ALT',    color: '#9945FF', gradient: 'linear-gradient(90deg,#14F195,#9945FF)', current: Math.round(altWeight * 100) },
    { label: 'Stable', color: M.positive,  current: Math.round(stableWeight * 100) },
  ]
}

export default function AllocationCard({ allocations, regime, hidden = false }: AllocationCardProps) {
  const rc = getRegimeConfig(regime)

  return (
    <div style={{ ...card({ padding: 16 }), marginBottom: 12 }}>
      {/* Header: title + regime badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 600, color: M.text }}>
          Allocation
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
          color: rc.s, background: rc.d,
        }}>
          {rc.l}
        </span>
      </div>

      {/* Allocation rows */}
      {allocations.map((a, i) => (
        <div key={a.label} style={{ marginBottom: i < allocations.length - 1 ? 10 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 3, background: a.color }} />
              <span style={{ fontSize: 12, color: M.textSecondary }}>{a.label}</span>
            </div>
            <span style={{
              fontWeight: 600, fontSize: 12, color: M.text,
              fontFamily: FONT_BODY, fontFeatureSettings: "'tnum' 1, 'lnum' 1",
            }}>
              {hidden ? '••' : `${a.current}%`}
            </span>
          </div>

          <div style={{ height: 5, borderRadius: 5, background: M.borderSubtle }}>
            {!hidden && a.current > 0 && (
              <div style={{
                height: '100%', borderRadius: 5,
                width: `${Math.min(100, a.current)}%`,
                background: a.gradient || a.color,
                transition: 'width 0.4s ease',
              }} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
