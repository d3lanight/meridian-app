// ━━━ Portfolio Snapshot API ━━━
// v2.4.0 · S151
// Changelog:
//  v1.1.0 — Enriched holdings with cost_basis + category
//  v1.2.0 — Enriched holdings include include_in_exposure flag
//  v1.3.0 — Fix: portfolio_exposure uses created_at, not timestamp
//  v2.0.0 — S142: restore clobbered file, add risk_profile + target_bands (4-bucket)
//  v2.1.0 — S132: enrich alt_breakdown with icon_url, add btc/eth icon_urls to response
//  v2.2.0 — S141: enrich holdings with current price + PnL (price_at_add vs asset_prices)
//  v2.3.0 — S144: Compute and return risk_score (0–100) from weights vs target bands
//  v2.4.0 — S151: Band-relative alignment score (replaces maxOver formula)

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EnrichedHolding } from '@/types'
import { getTargetBands, resolveProfile } from '@/lib/risk-profiles'
import type { RiskProfile, RegimeKey } from '@/lib/risk-profiles'

interface ExposureRow {
  btc_weight_all: number | null
  eth_weight_all: number | null
  alt_weight_all: number | null
  btc_value_usd: string | number | null
  eth_value_usd: string | number | null
  alt_value_usd: string | number | null
  alt_count: number | null
  alt_unpriced: string | null
  alt_breakdown: string | unknown[] | null
  total_value_usd_all: string | number | null
  holdings_count: number | null
  holdings_json: string | unknown[] | null
  created_at: string | null
}

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
}

// Resolve regime string from latest_regime to RegimeKey
function toRegimeKey(regime: string | null): RegimeKey {
  const map: Record<string, RegimeKey> = {
    bull: 'bull', bear: 'bear', range: 'range',
    volatility: 'volatility', insufficient_data: 'insufficient_data',
  }
  return map[regime ?? ''] ?? 'insufficient_data'
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parallel fetch: exposure + holdings + user preferences + current regime
    const [expResult, holdingsResult, prefResult, regimeResult, assetPricesResult] = await Promise.all([
      supabase
        .from('latest_exposure')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('portfolio_holdings')
        .select('asset, quantity, cost_basis, include_in_exposure, price_at_add, created_at')
        .eq('user_id', user.id)
        .order('asset', { ascending: true }),
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
      supabase
        .from('asset_prices')
        .select('asset_id, price_usd, asset_mapping(symbol)')
        .order('fetched_at', { ascending: false }),
    ])

    if (expResult.error || !expResult.data) {
      return NextResponse.json(EMPTY)
    }

    // Build symbol → current price map from asset_prices (first/latest row per symbol)
    const currentPrices: Record<string, number> = {}
    for (const row of (assetPricesResult.data ?? []) as any[]) {
      const symbol = row.asset_mapping?.symbol
      if (symbol && row.price_usd != null && !(symbol in currentPrices)) {
        currentPrices[symbol] = Number(row.price_usd)
      }
    }

    const exposure = expResult.data as unknown as ExposureRow

    // Resolve risk profile + target bands
    const rawProfile = (prefResult.data?.risk_profile ?? null) as RiskProfile | null
    const resolvedProfile = resolveProfile(rawProfile)
    const regimeKey = toRegimeKey(regimeResult.data?.regime_type ?? null)
    const targetBands = getTargetBands(rawProfile, regimeKey)

    // S144: compute risk_score (0–100) from actual weights vs target bands
    // S151: Band-relative alignment score (0-100)
    // Deviation measured relative to band width — narrow bands penalize harder.
    // Clamped at 1.0 per bucket, averaged across 4. No single-bucket cap.
    // Examples (conservative/bull): 80% ETH → ~14, balanced → 100, slight drift → ~77
    function computeRiskScore(
      weights: { btc: number; eth: number; alt: number; stable: number },
      bands: typeof targetBands
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
        // Band-relative: 2x band width = max penalty per bucket
        const relDev = bandWidth > 0 ? Math.min(1, overshoot / (bandWidth * 2)) : 0
        totalRelDev += relDev
      }

      const avgDev = totalRelDev / buckets.length
      return Math.round(Math.max(0, Math.min(100, (1 - avgDev) * 100)))
    }

    // Build category + icon lookup from asset_mapping
    const { data: mappings } = await supabase
      .from('asset_mapping')
      .select('symbol, category, icon_url')
      .eq('active', true)

    const categoryMap: Record<string, string> = {}
    const iconMap: Record<string, string | null> = {}
    if (mappings) {
      for (const m of mappings) {
        categoryMap[m.symbol] = m.category
        iconMap[m.symbol] = m.icon_url ?? null
      }
    }

    // Build enriched holdings array
    const enrichedHoldings = (holdingsResult.data ?? []).map((h: any) => {
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
      }
    })

    let altBreakdown = exposure.alt_breakdown
    if (typeof altBreakdown === 'string') {
      try { altBreakdown = JSON.parse(altBreakdown) } catch { altBreakdown = [] }
    }

    // S132: enrich alt_breakdown entries with icon_url from iconMap
    const enrichedAltBreakdown = Array.isArray(altBreakdown)
      ? (altBreakdown as any[]).map(entry => ({
          ...entry,
          icon_url: iconMap[entry.asset] ?? null,
        }))
      : []

    let holdingsJson = exposure.holdings_json
    if (typeof holdingsJson === 'string') {
      try { holdingsJson = JSON.parse(holdingsJson) } catch { holdingsJson = [] }
    }

    return NextResponse.json({
      isEmpty: false,
      btc_weight_all: exposure.btc_weight_all ?? 0,
      eth_weight_all: exposure.eth_weight_all ?? 0,
      alt_weight_all: exposure.alt_weight_all ?? 0,
      btc_value_usd: Number(exposure.btc_value_usd) || 0,
      eth_value_usd: Number(exposure.eth_value_usd) || 0,
      alt_value_usd: Number(exposure.alt_value_usd) || 0,
      // S132: icon_urls for BTC + ETH (direct fields, not in alt_breakdown)
      btc_icon_url: iconMap['BTC'] ?? null,
      eth_icon_url: iconMap['ETH'] ?? null,
      alt_count: exposure.alt_count ?? 0,
      alt_unpriced: exposure.alt_unpriced ?? '[]',
      alt_breakdown: enrichedAltBreakdown,
      total_value_usd_all: Number(exposure.total_value_usd_all) || 0,
      holdings_count: exposure.holdings_count ?? 0,
      holdings_json: holdingsJson ?? [],
      enriched_holdings: enrichedHoldings,
      timestamp: exposure.created_at,
      risk_score: computeRiskScore(
        {
          btc: exposure.btc_weight_all ?? 0,
          eth: exposure.eth_weight_all ?? 0,
          alt: exposure.alt_weight_all ?? 0,
          stable: Math.max(0, 1 - (exposure.btc_weight_all ?? 0) - (exposure.eth_weight_all ?? 0) - (exposure.alt_weight_all ?? 0)),
        },
        targetBands
      ),
      // S142: risk profile + target bands for current regime
      risk_profile: resolvedProfile,
      target_bands: targetBands,
      // S141: get current prices
      current_prices: currentPrices,
    })
  } catch (err) {
    console.error('[portfolio-snapshot] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}