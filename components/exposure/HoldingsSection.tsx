// ━━━ HoldingsSection Component ━━━
// v1.4.0 · S173 · Sprint 35
// Added: isPro, enrichedHoldings, currentPrices, coinContext, portfolioHoldings, onEdit
// HoldingCard updated to v2.4.0 (expandable, sparkline, 24h change, P&L)

'use client'

import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import HoldingCard from '@/components/exposure/HoldingCard'
import type { AltHolding } from '@/types'
import type { TargetBands } from '@/lib/risk-profiles'
import { usePortfolio } from '@/hooks/usePortfolio'

// ─── Props ────────────────────────────────────────────────────────────────────

interface HoldingRow {
  symbol:   string
  name?:    string
  iconUrl?: string | null
  valueUsd: number
  weight:   number   // 0–1
  category: 'BTC' | 'ETH' | 'ALT' | 'STABLE'
}

interface HoldingsSectionProps {
  btcWeight:    number
  ethWeight:    number
  altWeight:    number
  stableWeight: number
  btcValueUsd:  number
  ethValueUsd:  number
  altValueUsd:  number
  btcIconUrl?:  string | null
  ethIconUrl?:  string | null
  altBreakdown: AltHolding[]
  totalValue:   number
  targetBands:  TargetBands | null
  score:        number        // posture score 0–100
  mounted:      boolean
  hidden?:      boolean
  isPro?:       boolean
  enrichedHoldings?: any[]
  currentPrices?: Record<string, { price: number; change_24h: number }>
  coinContext?: Record<string, { sparkline?: number[]; high30d?: number; low30d?: number; change30d?: number; beta?: number }>
  onEdit?: (id: string) => void
}

// ─── Fallback bands ───────────────────────────────────────────────────────────

const FALLBACK_BANDS: TargetBands = {
  btc: [35, 50], eth: [15, 25], alt: [10, 20], stable: [5, 15],
}

// ─── Flag logic ───────────────────────────────────────────────────────────────

/**
 * Find the most-overweight category, then the largest holding in it.
 * Returns the symbol of the flagged holding, or null if posture >= 40.
 */
function findFlaggedSymbol(
  rows: HoldingRow[],
  targetBands: TargetBands,
  score: number,
): string | null {
  if (score >= 40) return null

  const categories: { cat: 'BTC' | 'ETH' | 'ALT' | 'STABLE'; band: [number, number] }[] = [
    { cat: 'BTC',    band: targetBands.btc },
    { cat: 'ETH',    band: targetBands.eth },
    { cat: 'ALT',    band: targetBands.alt },
    { cat: 'STABLE', band: targetBands.stable },
  ]

  let mostOverweight: { cat: string; excess: number } | null = null

  for (const { cat, band } of categories) {
    const row = rows.find(r => r.category === cat)
    if (!row) continue
    const pct = row.weight * 100
    const excess = pct - band[1]  // positive = overweight
    if (excess > 0 && (!mostOverweight || excess > mostOverweight.excess)) {
      mostOverweight = { cat, excess }
    }
  }

  if (!mostOverweight) return null

  // Largest holding in that category
  const inCategory = rows.filter(r => r.category === mostOverweight!.cat)
  if (!inCategory.length) return null
  inCategory.sort((a, b) => b.valueUsd - a.valueUsd)
  return inCategory[0].symbol
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HoldingsSection({
  btcWeight,
  ethWeight,
  altWeight,
  stableWeight,
  btcValueUsd,
  ethValueUsd,
  altValueUsd,
  btcIconUrl,
  ethIconUrl,
  altBreakdown,
  totalValue,
  targetBands,
  score,
  mounted,
  hidden = false,
  isPro = false,
  enrichedHoldings = [],
  currentPrices = {},
  coinContext = {},
  onEdit,
}: HoldingsSectionProps) {
  const bands = targetBands ?? FALLBACK_BANDS
  const isMisaligned = score < 40

  // Build lookup maps
  const enrichedMap: Record<string, any> = {}
  for (const h of enrichedHoldings) {
    if (h?.asset) enrichedMap[h.asset.toUpperCase()] = h
  }

  const { holdings: portfolioHoldings } = usePortfolio()
  const holdingIdMap: Record<string, string> = {}
  for (const h of portfolioHoldings) {
    if (h?.asset) holdingIdMap[h.asset.toUpperCase()] = h.id
  }

  // Build rows
  const rows: HoldingRow[] = []

  // BTC
  if (btcWeight > 0 || btcValueUsd > 0) {
    rows.push({ symbol: 'BTC', iconUrl: btcIconUrl, valueUsd: btcValueUsd, weight: btcWeight, category: 'BTC' })
  }

  // ETH — fold when weight = 0 and no ETH value (ETH-fold spec)
  if (ethWeight > 0 || ethValueUsd > 0) {
    rows.push({ symbol: 'ETH', iconUrl: ethIconUrl, valueUsd: ethValueUsd, weight: ethWeight, category: 'ETH' })
  }

  // ALTs — from alt_breakdown (icon_url enriched by snapshot API v2.1)
  for (const alt of altBreakdown) {
    if (alt.value_usd == null || alt.value_usd === 0) continue
    const weight = totalValue > 0 ? (alt.value_usd / totalValue) : 0
    const isStable = ['USDC', 'USDT', 'USDS', 'DAI', 'FRAX', 'PYUSD', 'FDUSD', 'USDE', 'USDAI'].includes(alt.asset)
    rows.push({
      symbol:   alt.asset,
      iconUrl:  (alt as any).icon_url ?? null,
      valueUsd: alt.value_usd,
      weight,
      category: isStable ? 'STABLE' : 'ALT',
    })
  }

  // Sort by value descending
  rows.sort((a, b) => b.valueUsd - a.valueUsd)

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
      {rows.map((row, i) => (
        <HoldingCard
          key={row.symbol}
          symbol={row.symbol}
          name={row.name ?? row.symbol}
          iconUrl={row.iconUrl}
          pctExposure={Math.round(row.weight * 100)}
          inPosture={true}
          offTarget={row.symbol === flaggedSymbol}
          hidden={hidden}
          isPro={isPro}
          qty={enrichedMap[row.symbol]?.quantity ?? 0}
          price={enrichedMap[row.symbol]?.price_usd ?? currentPrices[row.symbol]?.price ?? 0}
          addedPrice={enrichedMap[row.symbol]?.price_at_add ?? 0}
          addedDate={enrichedMap[row.symbol]?.created_at ?? null}
          change24h={currentPrices[row.symbol]?.change_24h ?? 0}
          sparkline={coinContext[row.symbol]?.sparkline ?? []}
          high30d={coinContext[row.symbol]?.high30d ?? 0}
          low30d={coinContext[row.symbol]?.low30d ?? 0}
          change30d={coinContext[row.symbol]?.change30d ?? 0}
          beta={coinContext[row.symbol]?.beta ?? 0}
          holdingId={holdingIdMap[row.symbol] ?? null}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
