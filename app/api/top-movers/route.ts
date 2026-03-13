// ━━━ Top Movers API ━━━
// v1.4.0 · Sprint 42 — Redis server-side cache (TTL 120s) + swap to createAnonClient
// v1.3.0 · S205 · Sprint 42 — Cache-Control header added
// v1.2.0 · S162 · Sprint 34
// Returns top 5 gainers and 5 losers from asset_prices
// icon_url from asset_mapping. Excludes stablecoins. No auth required.

import { NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/anon'
import { cacheGet, cacheSet } from '@/lib/redis'

const CACHE_KEY = 'api:top-movers'
const CACHE_TTL = 120 // seconds — data refreshes every ~4h via pipeline

export async function GET() {
  try {
    // Cache hit — return immediately
    const cached = await cacheGet<object>(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
      })
    }

    // Cache miss — fetch from Supabase
    const supabase = createAnonClient()

    const { data, error } = await supabase
      .from('asset_prices')
      .select('price_usd, change_24h, asset_mapping!inner(symbol, name, category, icon_url)')
      .not('price_usd', 'is', null)
      .not('change_24h', 'is', null)
      .order('change_24h', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data ?? [])
      .filter((row: any) => row.asset_mapping.category !== 'stable')
      .map((row: any) => ({
        symbol: row.asset_mapping.symbol,
        name: row.asset_mapping.name,
        price: Number(row.price_usd),
        change_24h: Number(row.change_24h),
        icon_url: row.asset_mapping.icon_url ?? null,
      }))

    const gainers = rows.filter((r: any) => r.change_24h > 0).slice(0, 5)
    const losers = rows.filter((r: any) => r.change_24h < 0).sort((a: any, b: any) => a.change_24h - b.change_24h).slice(0, 5)

    const payload = { gainers, losers, total: rows.length }

    await cacheSet(CACHE_KEY, payload, CACHE_TTL)

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}