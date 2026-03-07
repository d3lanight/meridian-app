// /api/coin-context/route.ts
// v3.0.0 · S165 · Sprint 35
// Cache reader with live fallback for cache misses.
// Primary data: asset_context table (populated by n8n flow ca-flow-phase5.3 every 4h).
// Fallback: single CoinGecko fetch per missing coin, then cache the result.
// Auth required (Pro feature).

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface CoinContext {
  sparkline: number[]
  beta: number
  high30d: number
  low30d: number
  change30d: number
}

// ── CoinGecko fallback for cache misses ───────────────────────────────────────

async function fetchSparkline(coingeckoId: string): Promise<number[] | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=30&interval=daily`,
      { headers: { accept: 'application/json', 'User-Agent': 'Meridian/1.0' } }
    )
    if (!res.ok) return null
    const json = await res.json()
    const prices: number[] = (json.prices ?? []).map((p: [number, number]) => p[1])
    return prices.length >= 2 ? prices : null
  } catch {
    return null
  }
}

function dailyReturns(prices: number[]): number[] {
  const r: number[] = []
  for (let i = 1; i < prices.length; i++) r.push((prices[i] - prices[i - 1]) / prices[i - 1])
  return r
}

function computeBeta(coinReturns: number[], btcReturns: number[]): number {
  const n = Math.min(coinReturns.length, btcReturns.length)
  if (n < 3) return 1
  const sc = coinReturns.slice(0, n)
  const sb = btcReturns.slice(0, n)
  const mc = sc.reduce((s, v) => s + v, 0) / n
  const mb = sb.reduce((s, v) => s + v, 0) / n
  let cov = 0, varB = 0
  for (let i = 0; i < n; i++) { cov += (sc[i] - mc) * (sb[i] - mb); varB += (sb[i] - mb) ** 2 }
  return varB === 0 ? 0 : Math.round((cov / varB) * 10) / 10
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const symbols = (searchParams.get('symbols') ?? '')
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20)

  if (symbols.length === 0) {
    return NextResponse.json({ error: 'Missing symbols param' }, { status: 400 })
  }

  // 1. Read from cache
  const { data: rows } = await supabase
    .from('asset_context')
    .select('asset_id, sparkline_30d, beta, high_30d, low_30d, change_30d')
    .in('asset_id', symbols)

  const result: Record<string, CoinContext> = {}
  const cached = new Set<string>()

  for (const row of rows ?? []) {
    result[row.asset_id] = {
      sparkline: row.sparkline_30d as number[],
      beta: Number(row.beta) ?? 0,
      high30d: Number(row.high_30d) ?? 0,
      low30d: Number(row.low_30d) ?? 0,
      change30d: Number(row.change_30d) ?? 0,
    }
    cached.add(row.asset_id)
  }

  // 2. Find cache misses
  const missing = symbols.filter(s => !cached.has(s))
  if (missing.length === 0) {
    return NextResponse.json(result)
  }

  // 3. Look up coingecko_ids for missing symbols
  const { data: mappings } = await supabase
    .from('asset_mapping')
    .select('symbol, coingecko_id')
    .in('symbol', missing)
    .eq('active', true)

  const geckoMap: Record<string, string> = {}
  for (const m of mappings ?? []) {
    if (m.coingecko_id) geckoMap[m.symbol] = m.coingecko_id
  }

  // 4. Get BTC reference for beta (from cache or fetch)
  let btcReturns: number[] = []
  if (result.BTC?.sparkline?.length) {
    btcReturns = dailyReturns(result.BTC.sparkline)
  } else {
    const btcPrices = await fetchSparkline('bitcoin')
    if (btcPrices) btcReturns = dailyReturns(btcPrices)
  }

  // 5. Fetch missing coins (max 3 to avoid rate limits on single request)
  for (const sym of missing.slice(0, 3)) {
    const geckoId = geckoMap[sym]
    if (!geckoId) continue

    const prices = await fetchSparkline(geckoId)
    if (!prices || prices.length < 2) continue

    const high30d = Math.max(...prices)
    const low30d = Math.min(...prices)
    const first = prices[0]
    const last = prices[prices.length - 1]
    const change30d = first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : 0
    const beta = sym === 'BTC' ? 1 : btcReturns.length >= 3 ? computeBeta(dailyReturns(prices), btcReturns) : 1

    const sparkline = prices.length > 35
      ? prices.filter((_, i) => i % Math.ceil(prices.length / 30) === 0 || i === prices.length - 1)
      : prices

    const ctx: CoinContext = {
      sparkline,
      beta,
      high30d: parseFloat(high30d.toPrecision(6)),
      low30d: parseFloat(low30d.toPrecision(6)),
      change30d,
    }

    result[sym] = ctx

    // Cache the result for next time
    await supabase
      .from('asset_context')
      .upsert({
        asset_id: sym,
        sparkline_30d: sparkline,
        beta,
        high_30d: ctx.high30d,
        low_30d: ctx.low30d,
        change_30d: ctx.change30d,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'asset_id' })
  }

  return NextResponse.json(result)
}