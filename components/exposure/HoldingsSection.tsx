// ━━━ HoldingsSection Component ━━━
// v2.2.0 · S189i
// Changelog:
//   v2.2.0 — S189i: Two surgical fixes for "Most Exposed" false-positive:
//            1. findFlaggedSymbol: inCategory filtered to weight > 0 only — excluded coins
//               (weight=0) can no longer receive "Off target" pill.
//            2. isMisaligned: only true if score < 40 AND at least one in-posture bucket
//               genuinely exceeds its target band. Prevents "Most Exposed" header from
//               appearing purely due to normalisation shift after excluding a coin.
//            as denominator. Coins toggled off posture → 0%. Remaining coins
//            re-normalise immediately without waiting for server round-trip.
//   v2.0.0 — S189: Rows built from enrichedHoldings directly instead of
//            weight-decomposed BTC/ETH/alt props. Fixes:
//            - Stablecoins now appear as holding cards (category='stable')
//            - Qty display immediately reflects updated value (same data as HoldingCard)
//            - HoldingCard now receives decimals from asset_mapping
//   v1.4.0 — S173: isPro, enrichedHoldings, currentPrices, coinContext, portfolioHoldings, onEdit

'use client'

import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import HoldingCard from '@/components/exposure/HoldingCard'
import type { AltHolding } from '@/types'
import type { TargetBands } from '@/lib/risk-profiles'

// ─── Props ────────────────────────────────────────────────────────────────────

interface HoldingsSectionProps {
  // Legacy weight props — still used for AllocationCard, kept for compat
  btcWeight:    number
  ethWeight:    number
  altWeight:    number
  stableWeight: number
  btcValueUsd:  number
  ethValueUsd:  number
  altValueUsd:  number
  btcIconUrl?:  string | null
  ethIconUrl?:  string | null
  altBreakdown: AltHolding[]   // now includes stables (snapshot v3.1+)
  totalValue:   number
  targetBands:  TargetBands | null
  score:        number
  mounted:      boolean
  hidden?:      boolean
  isPro?:       boolean
  enrichedHoldings?: any[]
  currentPrices?: Record<string, { price: number; change_24h: number }>
  coinContext?: Record<string, { sparkline?: number[]; high30d?: number; low30d?: number; change30d?: number; beta?: number }>
  holdingIdMap?: Record<string, string>   // symbol → DB id, provided by parent
  onEdit?: (id: string) => void
}

// ─── Fallback bands ───────────────────────────────────────────────────────────

const FALLBACK_BANDS: TargetBands = {
  btc: [35, 50], eth: [15, 25], alt: [10, 20], stable: [5, 15],
}

// ─── Bucket category helper ───────────────────────────────────────────────────

type BucketCat = 'BTC' | 'ETH' | 'ALT' | 'STABLE'

function toBucketCat(symbol: string, rawCategory: string | null): BucketCat {
  if (symbol === 'BTC') return 'BTC'
  if (symbol === 'ETH') return 'ETH'
  if (rawCategory === 'stable') return 'STABLE'
  return 'ALT'
}

// ─── Flag logic ───────────────────────────────────────────────────────────────

interface HoldingRow {
  symbol:   string
  iconUrl?: string | null
  valueUsd: number
  weight:   number
  category: BucketCat
}

function findFlaggedSymbol(
  rows: HoldingRow[],
  targetBands: TargetBands,
  score: number,
): string | null {
  if (score >= 40) return null

  const categories: { cat: BucketCat; band: [number, number] }[] = [
    { cat: 'BTC',    band: targetBands.btc },
    { cat: 'ETH',    band: targetBands.eth },
    { cat: 'ALT',    band: targetBands.alt },
    { cat: 'STABLE', band: targetBands.stable },
  ]

  // Aggregate weight per bucket
  const bucketWeight: Record<string, number> = {}
  for (const r of rows) {
    bucketWeight[r.category] = (bucketWeight[r.category] ?? 0) + r.weight
  }

  let mostOverweight: { cat: string; excess: number } | null = null
  for (const { cat, band } of categories) {
    const pct = (bucketWeight[cat] ?? 0) * 100
    const excess = pct - band[1]
    if (excess > 0 && (!mostOverweight || excess > mostOverweight.excess)) {
      mostOverweight = { cat, excess }
    }
  }

  if (!mostOverweight) return null

  // Only consider in-posture holdings (weight > 0) — excluded coins must never get "Off target" pill
  const inCategory = rows.filter(r => r.category === mostOverweight!.cat && r.weight > 0)
  if (!inCategory.length) return null
  inCategory.sort((a, b) => b.valueUsd - a.valueUsd)
  return inCategory[0].symbol
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HoldingsSection({
  totalValue,
  targetBands,
  score,
  mounted,
  hidden = false,
  isPro = false,
  enrichedHoldings = [],
  currentPrices = {},
  coinContext = {},
  holdingIdMap = {},
  onEdit,
}: HoldingsSectionProps) {
  const bands = targetBands ?? FALLBACK_BANDS
  // isMisaligned = score is low AND at least one in-posture bucket is overweight.
  // Prevents "Most Exposed" from firing purely due to normalisation shift after excluding a coin.
  const hasInPostureOverweight = (() => {
    if (score >= 40) return false
    const bucketWeight: Record<string, number> = {}
    for (const h of enrichedHoldings) {
      if (!h?.asset || h.include_in_exposure === false) continue
      const sym = h.asset.toUpperCase()
      const cat = sym === 'BTC' ? 'BTC' : sym === 'ETH' ? 'ETH' : h.category === 'stable' ? 'STABLE' : 'ALT'
      bucketWeight[cat] = (bucketWeight[cat] ?? 0) + (h.value_usd ?? 0)
    }
    const postTotal = Object.values(bucketWeight).reduce((s, v) => s + v, 0)
    if (postTotal === 0) return false
    const checks = [
      { cat: 'BTC', band: bands.btc },
      { cat: 'ETH', band: bands.eth },
      { cat: 'ALT', band: bands.alt },
      { cat: 'STABLE', band: bands.stable },
    ]
    return checks.some(({ cat, band }) => ((bucketWeight[cat] ?? 0) / postTotal) * 100 > band[1])
  })()
  const isMisaligned = score < 40 && hasInPostureOverweight

  // Build rows directly from enrichedHoldings (all holdings, incl. stables)
  // Only holdings with a value are shown; unpriced holdings still appear with $0
  const rows: HoldingRow[] = enrichedHoldings
    .filter((h: any) => h?.asset)
    .map((h: any) => {
      const symbol = h.asset as string
      const valueUsd = h.value_usd ?? 0
      const bucketCat = toBucketCat(symbol, h.category)
      return {
        symbol,
        iconUrl: h.icon_url ?? null,
        valueUsd,
        weight: 0,         // filled below after postureTotal is known
        category: bucketCat,
      }
    })
    .sort((a, b) => b.valueUsd - a.valueUsd)

  // pctExposure = share of the IN-POSTURE portfolio only.
  // Coins toggled off posture show 0%; remaining coins re-normalise to 100%.
  const postureTotal = enrichedHoldings
    .filter((h: any) => h?.asset && (h.include_in_exposure ?? true))
    .reduce((sum: number, h: any) => sum + (h.value_usd ?? 0), 0)

  rows.forEach(row => {
    const enriched = enrichedHoldings.find((h: any) => h.asset === row.symbol)
    const inPosture = enriched?.include_in_exposure ?? true
    row.weight = (inPosture && postureTotal > 0) ? row.valueUsd / postureTotal : 0
  })

  const flaggedSymbol = findFlaggedSymbol(rows, bands, score)
  const sectionHeader = isMisaligned ? 'Most Exposed' : 'Holdings'

  if (!rows.length) return null

  return (
    <div style={{ ...card(), ...anim(mounted, 2), marginBottom: 16 }}>

      {/* ── Section header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: isMisaligned ? '#EF4444' : M.textMuted,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontFamily: "'Outfit', sans-serif",
        }}>
          {sectionHeader}
        </span>
        <span style={{
          fontSize: 11,
          color: M.textMuted,
          fontFamily: "'Outfit', sans-serif",
        }}>
          {rows.length} asset{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Holding rows ── */}
      {rows.map((row) => {
        const enriched = enrichedHoldings.find((h: any) => h.asset === row.symbol)
        return (
          <HoldingCard
            key={row.symbol}
            symbol={row.symbol}
            name={row.symbol}
            iconUrl={row.iconUrl}
            pctExposure={Math.round(row.weight * 100)}
            inPosture={enriched?.include_in_exposure ?? true}
            offTarget={row.symbol === flaggedSymbol}
            hidden={hidden}
            isPro={isPro}
            qty={enriched?.quantity ?? 0}
            decimals={enriched?.decimals ?? null}
            price={enriched?.price_usd ?? currentPrices[row.symbol]?.price ?? 0}
            addedPrice={enriched?.price_at_add ?? 0}
            addedDate={enriched?.created_at ?? null}
            change24h={currentPrices[row.symbol]?.change_24h ?? 0}
            sparkline={coinContext[row.symbol]?.sparkline ?? []}
            high30d={coinContext[row.symbol]?.high30d ?? 0}
            low30d={coinContext[row.symbol]?.low30d ?? 0}
            change30d={coinContext[row.symbol]?.change30d ?? 0}
            beta={coinContext[row.symbol]?.beta ?? 0}
            holdingId={holdingIdMap[row.symbol] ?? null}
            onEdit={onEdit}
          />
        )
      })}
    </div>
  )
}
