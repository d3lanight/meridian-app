// ━━━ Asset Search API ━━━
// v1.0.0 · ca-story108 · 2026-03-01
// GET /api/asset-search?q=term
// Local-first search with CoinGecko fallback

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const COINGECKO_SEARCH = 'https://api.coingecko.com/api/v3/search'
const MIN_LOCAL_RESULTS = 3
const MAX_RESULTS = 20

interface SearchResult {
  id: string
  symbol: string
  name: string
  icon_url: string | null
  category: string | null
  subcategory: string | null
  rank: number | null
  coingecko_id: string | null
  source: 'local' | 'remote'
}

export async function GET(request: Request) {
  const supabase = await createClient()

  // Auth required
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 1) {
    return NextResponse.json({ error: 'Query parameter q required (min 1 char)' }, { status: 400 })
  }

  // ── 1. Local search: asset_mapping ──
  const pattern = `%${q}%`
  const { data: localRows, error: localErr } = await supabase
    .from('asset_mapping')
    .select('id, symbol, name, icon_url, category, subcategory, rank, coingecko_id')
    .eq('active', true)
    .or(`name.ilike.${pattern},symbol.ilike.${pattern}`)
    .order('rank', { ascending: true, nullsFirst: false })
    .limit(MAX_RESULTS)

  if (localErr) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }

  const localResults: SearchResult[] = (localRows ?? []).map(r => ({
    ...r,
    source: 'local' as const,
  }))

  // ── 2. CoinGecko fallback if < MIN_LOCAL_RESULTS ──
  let remoteResults: SearchResult[] = []

  if (localResults.length < MIN_LOCAL_RESULTS) {
    try {
      const cgRes = await fetch(`${COINGECKO_SEARCH}?query=${encodeURIComponent(q)}`)

      if (cgRes.ok) {
        const cgData = await cgRes.json()
        const coins = cgData.coins ?? []

        // Filter out coins we already have locally
        const localCgIds = new Set(localResults.map(r => r.coingecko_id).filter(Boolean))

        remoteResults = coins
          .filter((c: { id: string }) => !localCgIds.has(c.id))
          .slice(0, MAX_RESULTS - localResults.length)
          .map((c: { id: string; symbol: string; name: string; thumb: string; market_cap_rank: number | null }) => ({
            id: `remote-${c.id}`,
            symbol: c.symbol?.toUpperCase() ?? '',
            name: c.name ?? '',
            icon_url: c.thumb ?? null,
            category: null,
            subcategory: null,
            rank: c.market_cap_rank ?? null,
            coingecko_id: c.id,
            source: 'remote' as const,
          }))
      }
    } catch {
      // CoinGecko fallback is best-effort — don't fail the request
    }
  }

  const results = [...localResults, ...remoteResults]

  return NextResponse.json({
    results,
    local_count: localResults.length,
    remote_count: remoteResults.length,
    query: q,
  })
}

// ── POST /api/asset-search — Add remote asset to local catalog ──
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { coingecko_id, symbol, name, icon_url } = body

  if (!coingecko_id || !symbol || !name) {
    return NextResponse.json(
      { error: 'coingecko_id, symbol, and name are required' },
      { status: 400 },
    )
  }

  // Upsert into asset_mapping — if it already exists by coingecko_id, no-op
  const { data, error } = await supabase
    .from('asset_mapping')
    .upsert(
      {
        coingecko_id,
        symbol: symbol.toUpperCase(),
        name,
        icon_url: icon_url ?? null,
        source: 'user_added',
        active: true,
        category: 'alt',
      },
      { onConflict: 'coingecko_id' },
    )
    .select('id, symbol, name, icon_url, coingecko_id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to add asset' }, { status: 500 })
  }

  return NextResponse.json({ asset: data })
}