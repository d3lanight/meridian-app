// ━━━ Top Movers API ━━━
// v1.3.0 · S205 · Sprint 42 — Cache-Control header added (s-maxage=120, stale-while-revalidate=600)
// v1.2.0 · S162 · Sprint 34
// Returns top 5 gainers and 5 losers from asset_prices
// icon_url from asset_mapping. Excludes stablecoins. No auth required.
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

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

    // Only positive changes are gainers, only negative are losers
    const gainers = rows.filter((r: any) => r.change_24h > 0).slice(0, 5)
    const losers = rows.filter((r: any) => r.change_24h < 0).sort((a: any, b: any) => a.change_24h - b.change_24h).slice(0, 5)

    return NextResponse.json({ gainers, losers, total: rows.length }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}