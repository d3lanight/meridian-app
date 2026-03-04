// ━━━ AllocationSection Component ━━━
// v1.0.0 · ca-story131 · Sprint 28
// Allocation vs Targets section — 4-bucket view (BTC / ETH / ALT / STABLE)
// Target bands sourced from portfolio-snapshot (lib/risk-profiles.ts, profile-aware)

'use client'

import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import AllocRow from '@/components/exposure/AllocRow'
import type { TargetBands } from '@/lib/risk-profiles'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AllocationSectionProps {
  btcWeight:    number          // 0–1
  ethWeight:    number          // 0–1
  altWeight:    number          // 0–1
  stableWeight: number          // 0–1 (derived: 1 - btc - eth - alt)
  targetBands:  TargetBands | null
  mounted:      boolean
  hidden?:      boolean
}

// ─── Fallback bands (Neutral + volatility) ────────────────────────────────────
// Used when target_bands is null (empty portfolio or API error)

const FALLBACK_BANDS: TargetBands = {
  btc: [35, 50],
  eth: [15, 25],
  alt: [10, 20],
  stable: [5, 15],
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AllocationSection({
  btcWeight,
  ethWeight,
  altWeight,
  stableWeight,
  targetBands,
  mounted,
  hidden = false,
}: AllocationSectionProps) {
  const bands = targetBands ?? FALLBACK_BANDS

  const rows: { category: string; weight: number; band: [number, number] }[] = [
    { category: 'BTC',    weight: btcWeight,    band: bands.btc },
    { category: 'ETH',    weight: ethWeight,    band: bands.eth },
    { category: 'ALT',    weight: altWeight,    band: bands.alt },
    { category: 'STABLE', weight: stableWeight, band: bands.stable },
  ]

  const anyWarning = rows.some(r => {
    const pct = Math.round(r.weight * 100)
    return pct < r.band[0] || pct > r.band[1]
  })

  return (
    <div style={{ ...card(), ...anim(mounted, 1), marginBottom: 16 }}>

      {/* ── Section header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: M.textMuted,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontFamily: "'Outfit', sans-serif",
        }}>
          Allocation vs Targets
        </span>
        {anyWarning && (
          <span style={{
            fontSize: 11,
            color: '#F59E0B',
            fontWeight: 500,
            fontFamily: "'Outfit', sans-serif",
          }}>
            Outside target
          </span>
        )}
      </div>

      {/* ── Rows ── */}
      {rows.map(r => (
        <AllocRow
          key={r.category}
          category={r.category}
          current={r.weight}
          targetMin={r.band[0]}
          targetMax={r.band[1]}
          hidden={hidden}
        />
      ))}

      {/* ── Legend ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }} />
          <span style={{ fontSize: 10, color: M.textMuted, fontFamily: "'Outfit', sans-serif" }}>
            Target zone
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#F59E0B' }}>⚠</span>
          <span style={{ fontSize: 10, color: M.textMuted, fontFamily: "'Outfit', sans-serif" }}>
            Outside target
          </span>
        </div>
      </div>
    </div>
  )
}
