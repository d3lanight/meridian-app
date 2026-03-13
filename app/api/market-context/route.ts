// ━━━ Market Context API ━━━
// v3.10.0 · Sprint 42 — days param now mirrors window (180/360 supported). VALID_DAYS expanded.
// v3.9.0 · Sprint 42 — Redis server-side cache (TTL 60s, keyed by window param).
//                       Supabase only hit on cache miss.
// v3.8.0 · S207-fix · Sprint 42 — swap createClient → createAnonClient
// v3.7.0 · S205 · Sprint 42 — Cache-Control header added
// v3.6.0 · S187 · Sprint 38 — window param added
// v3.5.0 · S176 · Sprint 36 — is_volatile added
// v3.4.0 · S173 · Sprint 35 — current_prices for ALL symbols
// Fetches regime history + price history + duration patterns + transitions + intraday signals

import { NextRequest, NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/anon'
import { cacheGet, cacheSet } from '@/lib/redis'

const CACHE_TTL = 60 // seconds — keyed per window value

// Days must match valid windows — history depth follows the user's regime view
const VALID_DAYS = [7, 30, 90, 180, 360] as const
type ValidDays = (typeof VALID_DAYS)[number]

function parseDays(param: string | null): ValidDays {
  const n = Number(param)
  if (VALID_DAYS.includes(n as ValidDays)) return n as ValidDays
  return 30
}

const VALID_WINDOWS = [7, 30, 90, 180, 360] as const
type ValidWindow = (typeof VALID_WINDOWS)[number]

function parseWindow(param: string | null): ValidWindow | null {
  if (param === null) return 30
  const n = parseInt(param, 10)
  if (VALID_WINDOWS.includes(n as ValidWindow)) return n as ValidWindow
  return null
}

interface Transition {
  from: string
  to: string
  count: number
  last_seen: string
}

function aggregateTransitions(regimes: any[]): Transition[] {
  const changes = regimes.filter(r => r.regime_changed && r.previous_regime)
  const map = new Map<string, { count: number; last_seen: string }>()

  for (const r of changes) {
    const key = `${r.previous_regime}→${r.regime}`
    const existing = map.get(key)
    if (!existing) {
      map.set(key, { count: 1, last_seen: r.market_timestamp })
    } else {
      existing.count++
      if (!existing.last_seen || r.market_timestamp > existing.last_seen) {
        existing.last_seen = r.market_timestamp
      }
    }
  }

  const transitions: Transition[] = []
  for (const [key, val] of map) {
    const [from, to] = key.split('→')
    transitions.push({ from, to, count: val.count, last_seen: val.last_seen })
  }

  transitions.sort((a, b) => b.count - a.count || b.last_seen.localeCompare(a.last_seen))
  return transitions
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseDays(searchParams.get('days'))
    const window = parseWindow(searchParams.get('window'))

    if (window === null) {
      return NextResponse.json(
        { error: 'Invalid window parameter. Valid values: 7, 30, 90, 180, 360' },
        { status: 400 }
      )
    }

    // Cache key includes window — each window is cached independently
    const cacheKey = `api:market-context:w${window}:d${days}`

    // Cache hit — return immediately
    const cached = await cacheGet<object>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      })
    }

    // Cache miss — fetch from Supabase
    const supabase = createAnonClient()

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffISO = cutoff.toISOString()

    const [regimeResult, priceResult, durationResult, livePriceResult, intradayResult] = await Promise.all([
      supabase
        .from('market_regimes')
        .select('market_timestamp, regime, previous_regime, regime_changed, confidence, price_now, r_1d, r_7d, vol_7d, is_volatile, eth_price_now, eth_r_7d, eth_vol_7d, window')
        .eq('window', window)
        .gte('created_at', cutoffISO)
        .order('created_at', { ascending: false }),
      supabase
        .from('crypto_prices')
        .select('timestamp, btc_usd, eth_usd')
        .order('timestamp', { ascending: false })
        .limit(14),
      supabase.rpc('regime_duration_stats'),
      supabase
        .from('asset_prices')
        .select('price_usd, change_24h, recorded_at, asset_mapping!inner(symbol)'),
      supabase
        .from('intraday_regimes')
        .select('regime, confidence, btc_r_short, eth_r_short, eth_confirming, created_at')
        .order('created_at', { ascending: false })
        .limit(6),
    ])

    const currentPrices: Record<string, { price: number; change_24h: number; recorded_at: string }> = {}
    for (const row of (livePriceResult.data ?? []) as any[]) {
      const symbol = row.asset_mapping?.symbol
      if (symbol) {
        currentPrices[symbol] = {
          price: Number(row.price_usd),
          change_24h: Math.round(Number(row.change_24h) * 100) / 100,
          recorded_at: row.recorded_at,
        }
      }
    }

    if (regimeResult.error) {
      console.error('market_regimes fetch error:', regimeResult.error)
      return NextResponse.json({ error: 'Failed to fetch regime data' }, { status: 500 })
    }

    if (priceResult.error) {
      console.error('crypto_prices fetch error:', priceResult.error)
      return NextResponse.json({ error: 'Failed to fetch price data' }, { status: 500 })
    }

    if (durationResult.error) {
      console.error('regime_duration_stats error:', durationResult.error)
    }

    const available = (regimeResult.data ?? []).length > 0

    const regimes = (regimeResult.data ?? []).map((r: any) => ({
      timestamp: r.market_timestamp,
      regime: r.regime,
      previous_regime: r.previous_regime,
      regime_changed: r.regime_changed,
      confidence: r.confidence,
      price_now: r.price_now,
      r_1d: r.r_1d,
      r_7d: r.r_7d,
      vol_7d: r.vol_7d,
      eth_price_now: r.eth_price_now,
      eth_r_7d: r.eth_r_7d,
      eth_vol_7d: r.eth_vol_7d,
      is_volatile: r.is_volatile ?? false,
      window: r.window,
    }))

    const transitions = aggregateTransitions(regimeResult.data ?? [])

    const intradaySignals = (intradayResult?.data ?? []).map((r: any) => ({
      time: r.created_at,
      regime: r.regime,
      confidence: r.confidence,
      btc_r_short: r.btc_r_short,
      eth_r_short: r.eth_r_short,
      eth_confirming: r.eth_confirming,
    }))

    const payload = {
      regimes,
      prices: priceResult.data ?? [],
      duration_patterns: durationResult.data ?? [],
      transitions,
      transition_count: transitions.reduce((sum, t) => sum + t.count, 0),
      row_count: regimes.length,
      days_requested: days,
      window,
      available,
      generated_at: new Date().toISOString(),
      current_prices: currentPrices,
      intraday_signals: intradaySignals,
    }

    await cacheSet(cacheKey, payload, CACHE_TTL)

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    console.error('Market context API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}