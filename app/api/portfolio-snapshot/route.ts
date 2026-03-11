// ━━━ Portfolio Snapshot API ━━━
// v3.1.0 · S189
// Changelog:
//  v3.1.0 — S189: Stablecoins now included in alt_breakdown (with category tag) so HoldingsSection
//           can render them. decimals added to enriched_holdings from asset_mapping.
//  v3.0.0 — S158: Live weight computation from portfolio_holdings × asset_prices (removes latest_exposure dependency)
//  v2.4.0 — S151: Band-relative alignment score (replaces maxOver formula)
//  v2.3.0 — S144: Compute and return risk_score (0–100) from weights vs target bands
//  v2.2.0 — S141: enrich holdings with current price + PnL (price_at_add vs asset_prices)
//  v2.1.0 — S132: enrich alt_breakdown with icon_url, add btc/eth icon_urls to response
//  v2.0.0 — S142: restore clobbered file, add risk_profile + target_bands (4-bucket)
//  v1.3.0 — Fix: portfolio_exposure uses created_at, not timestamp
//  v1.2.0 — Enriched holdings include include_in_exposure flag
//  v1.1.0 — Enriched holdings with cost_basis + category

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EnrichedHolding } from '@/types'
import { getTargetBands, resolveProfile } from '@/lib/risk-profiles'
import type { RiskProfile, RegimeKey } from '@/lib/risk-profiles'

const EMPTY = {
  isEmpty: true,
  btc_weight_all: 0, eth_weight_all: 0, alt_weight_all: 0,
  btc_value_usd: 0, eth_value_usd: 0, alt_value_usd: 0,
  btc_icon_url: null, eth_icon_url: null,
  alt_count: 0, alt_unpriced: '[]', alt_breakdown: [],
  total_value_usd_all: 0, holdings_count: 0, holdings_json: [],
  enriched_holdings: [],
  timestamp: null,
  risk_profile: null,
  target_bands: null,
  current_prices: {},
  risk_score: 0,
}

// Resolve regime string from latest_regime to RegimeKey
function toRegimeKey(regime: string | null): RegimeKey {
  const map: Record<string, RegimeKey> = {
    bull: 'bull', bear: 'bear', range: 'range',
    volatility: 'volatility', insufficient_data: 'insufficient_data',
  }
  return map[regime ?? ''] ?? 'insufficient_data'
}

// S151: Band-relative alignment score (0-100)
// Deviation measured relative to band width — narrow bands penalize harder.
// Clamped at 1.0 per bucket, averaged across 4. No single-bucket cap.
function computeRiskScore(
  weights: { btc: number; eth: number; alt: number; stable: number },
  bands: ReturnType<typeof getTargetBands>
): number {
  const buckets: Array<{ actual: number; min: number; max: number }> = [
    { actual: weights.btc * 100,    min: bands.btc[0],    max: bands.btc[1] },
    { actual: weights.eth * 100,    min: bands.eth[0],    max: bands.eth[1] },
    { actual: weights.alt * 100,    min: bands.alt[0],    max: bands.alt[1] },
    { actual: weights.stable * 100, min: bands.stable[0], max: bands.stable[1] },
  ]

  let totalRelDev = 0
  for (const b of buckets) {
    const overshoot = b.actual < b.min
      ? b.min - b.actual
      : b.actual > b.max
        ? b.actual - b.max
        : 0
    const bandWidth = b.max - b.min
    const relDev = bandWidth > 0 ? Math.min(1, overshoot / (bandWidth * 2)) : 0
    totalRelDev += relDev
  }

  const avgDev = totalRelDev / buckets.length
  return Math.round(Math.max(0, Math.min(100, (1 - avgDev) * 100)))
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parallel fetch: holdings + asset mapping + asset prices + preferences + regime
    const [holdingsResult, mappingsResult, assetPricesResult, prefResult, regimeResult] = await Promise.all([
      supabase
        .from('portfolio_holdings')
        .select('asset, quantity, cost_basis, include_in_exposure, price_at_add, created_at')
        .eq('user_id', user.id)
        .order('asset', { ascending: true }),
      supabase
        .from('asset_mapping')
        .select('symbol, category, icon_url, coingecko_id, decimals')
        .eq('active', true),
      supabase
        .from('asset_prices')
        .select('asset_id, price_usd, asset_mapping(symbol)'),
      supabase
        .from('user_preferences')
        .select('risk_profile')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('latest_regime')
        .select('regime_type')
        .limit(1)
        .single(),
    ])

    const allHoldings = holdingsResult.data ?? []

    // No holdings at all → empty state
    if (allHoldings.length === 0) {
      return NextResponse.json(EMPTY)
    }

    // ── Build lookup maps ──

    // symbol → category + icon_url + coingecko_id + decimals
    const categoryMap: Record<string, string> = {}
    const iconMap: Record<string, string | null> = {}
    const coingeckoMap: Record<string, string | null> = {}
    const decimalsMap: Record<string, number | null> = {}
    if (mappingsResult.data) {
      for (const m of mappingsResult.data) {
        categoryMap[m.symbol] = m.category
        iconMap[m.symbol] = m.icon_url ?? null
        coingeckoMap[m.symbol] = m.coingecko_id ?? null
        decimalsMap[m.symbol] = m.decimals ?? null
      }
    }

    // symbol → current price (first/latest row per symbol)
    const currentPrices: Record<string, number> = {}
    for (const row of (assetPricesResult.data ?? []) as any[]) {
      const symbol = row.asset_mapping?.symbol
      if (symbol && row.price_usd != null && !(symbol in currentPrices)) {
        currentPrices[symbol] = Number(row.price_usd)
      }
    }

    // ── Compute live weights from holdings × prices ──

    // Only include_in_exposure holdings contribute to weights
    const exposureHoldings = allHoldings.filter((h: any) => h.include_in_exposure !== false)

    let btcValueUsd = 0
    let ethValueUsd = 0
    let altValueUsd = 0
    let stableValueUsd = 0
    let totalValueAll = 0
    let altCount = 0
    const altUnpriced: string[] = []
    const altBreakdownRaw: Array<{ asset: string; quantity: number; coingecko_id: string | null; usd_price: number | null; value_usd: number | null; category: string }> = []

    for (const h of exposureHoldings as any[]) {
      const symbol = h.asset as string
      const quantity = Number(h.quantity) || 0
      const price = currentPrices[symbol] ?? null
      const valueUsd = price != null ? price * quantity : null
      const category = categoryMap[symbol] ?? 'alt'

      if (valueUsd != null) {
        totalValueAll += valueUsd
      }

      if (symbol === 'BTC') {
        btcValueUsd += valueUsd ?? 0
      } else if (symbol === 'ETH') {
        ethValueUsd += valueUsd ?? 0
      } else if (category === 'stable') {
        stableValueUsd += valueUsd ?? 0
        // Include stables in breakdown so HoldingsSection can render them
        altBreakdownRaw.push({
          asset: symbol,
          quantity,
          coingecko_id: coingeckoMap[symbol] ?? null,
          usd_price: price,
          value_usd: valueUsd,
          category: 'stable',
        })
      } else {
        // alt (includes anything not BTC/ETH/stable)
        altCount++
        if (price == null) {
          altUnpriced.push(symbol)
        }
        altValueUsd += valueUsd ?? 0
        altBreakdownRaw.push({
          asset: symbol,
          quantity,
          coingecko_id: coingeckoMap[symbol] ?? null,
          usd_price: price,
          value_usd: valueUsd,
          category: 'alt',
        })
      }
    }

    // Compute weights (0–1 fractions)
    const btcWeight = totalValueAll > 0 ? btcValueUsd / totalValueAll : 0
    const ethWeight = totalValueAll > 0 ? ethValueUsd / totalValueAll : 0
    const altWeight = totalValueAll > 0 ? altValueUsd / totalValueAll : 0
    const stableWeight = Math.max(0, 1 - btcWeight - ethWeight - altWeight)

    // ── Risk profile + target bands ──

    const rawProfile = (prefResult.data?.risk_profile ?? null) as RiskProfile | null
    const resolvedProfile = resolveProfile(rawProfile)
    const regimeKey = toRegimeKey(regimeResult.data?.regime_type ?? null)
    const targetBands = getTargetBands(rawProfile, regimeKey)

    // ── Enriched holdings (all holdings, not just exposure) ──

    const enrichedHoldings = allHoldings.map((h: any) => {
      const quantity     = Number(h.quantity) || 0
      const priceAtAdd   = h.price_at_add != null ? Number(h.price_at_add) : null
      const currentPrice = currentPrices[h.asset] ?? null
      const valueUsd     = currentPrice != null ? currentPrice * quantity : null
      const sinceAddedPct =
        priceAtAdd != null && priceAtAdd > 0 && currentPrice != null
          ? ((currentPrice - priceAtAdd) / priceAtAdd) * 100
          : null
      const usdDelta =
        priceAtAdd != null && currentPrice != null
          ? (currentPrice - priceAtAdd) * quantity
          : null

      return {
        asset:               h.asset,
        quantity,
        cost_basis:          h.cost_basis != null ? Number(h.cost_basis) : null,
        category:            (categoryMap[h.asset] as EnrichedHolding['category']) ?? null,
        include_in_exposure: h.include_in_exposure ?? true,
        price_at_add:        priceAtAdd,
        price_usd:           currentPrice,
        value_usd:           valueUsd,
        since_added_pct:     sinceAddedPct,
        usd_delta:           usdDelta,
        created_at:          h.created_at ?? null,
        icon_url:            iconMap[h.asset] ?? null,
        decimals:            decimalsMap[h.asset] ?? null,
      }
    })

    // Enrich alt_breakdown with icon_url
    const enrichedAltBreakdown = altBreakdownRaw.map(entry => ({
      ...entry,
      icon_url: iconMap[entry.asset] ?? null,
    }))

    // Build holdings_json (lightweight list for backward compat)
    const holdingsJson = allHoldings.map((h: any) => ({
      asset: h.asset,
      quantity: Number(h.quantity) || 0,
    }))

    return NextResponse.json({
      isEmpty: false,
      btc_weight_all: btcWeight,
      eth_weight_all: ethWeight,
      alt_weight_all: altWeight,
      btc_value_usd: btcValueUsd,
      eth_value_usd: ethValueUsd,
      alt_value_usd: altValueUsd,
      btc_icon_url: iconMap['BTC'] ?? null,
      eth_icon_url: iconMap['ETH'] ?? null,
      alt_count: altCount,
      alt_unpriced: JSON.stringify(altUnpriced),
      alt_breakdown: enrichedAltBreakdown,
      total_value_usd_all: totalValueAll,
      holdings_count: allHoldings.length,
      holdings_json: holdingsJson,
      enriched_holdings: enrichedHoldings,
      timestamp: new Date().toISOString(),
      risk_score: computeRiskScore(
        { btc: btcWeight, eth: ethWeight, alt: altWeight, stable: stableWeight },
        targetBands
      ),
      risk_profile: resolvedProfile,
      target_bands: targetBands,
      current_prices: currentPrices,
    })
  } catch (err) {
    console.error('[portfolio-snapshot] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}