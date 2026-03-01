// ━━━ Portfolio API ━━━
// v2.0.0 · ca-story109 · 2026-03-01
// GET  /api/portfolio — list holdings with asset_mapping metadata
// POST /api/portfolio — add holding with asset_id + auto price_at_add
//
// Changes from v1.3:
//   S106: price_at_add auto-captured on POST
//   S107: asset_id FK support, bidirectional trigger handles sync
//   S109: GET joins asset_mapping for icon_url, name, category, subcategory

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Join asset_mapping for enriched metadata
  const { data: holdings, error } = await supabase
    .from('portfolio_holdings')
    .select(`
      id,
      user_id,
      asset,
      asset_id,
      quantity,
      cost_basis,
      price_at_add,
      include_in_exposure,
      created_at,
      updated_at,
      asset_mapping (
        id,
        symbol,
        name,
        icon_url,
        category,
        subcategory,
        coingecko_id,
        rank
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 })
  }

  return NextResponse.json({ holdings: holdings ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { asset, asset_id, quantity, cost_basis } = body

  // Validate: need at least one identifier
  if (!asset && !asset_id) {
    return NextResponse.json(
      { error: 'Either asset (symbol) or asset_id (uuid) required' },
      { status: 400 },
    )
  }

  if (!quantity || Number(quantity) <= 0) {
    return NextResponse.json(
      { error: 'quantity must be a positive number' },
      { status: 400 },
    )
  }

  // Resolve asset_id if only symbol provided (for validation)
  let resolvedAssetId = asset_id ?? null
  const symbol = asset?.toUpperCase() ?? null

  if (!resolvedAssetId && symbol) {
    const { data: mapping } = await supabase
      .from('asset_mapping')
      .select('id')
      .eq('symbol', symbol)
      .eq('active', true)
      .limit(1)
      .single()

    if (mapping) {
      resolvedAssetId = mapping.id
    }
  }

  // Validate asset_id exists in asset_mapping (if we have one)
  if (resolvedAssetId) {
    const { data: exists } = await supabase
      .from('asset_mapping')
      .select('id')
      .eq('id', resolvedAssetId)
      .single()

    if (!exists) {
      return NextResponse.json(
        { error: 'asset_id not found in asset_mapping' },
        { status: 400 },
      )
    }
  }

  // S106: Auto-capture market price at time of add
  let priceAtAdd: number | null = null

  if (resolvedAssetId) {
    try {
      const { data: latestPrice } = await supabase
        .from('asset_prices')
        .select('price_usd')
        .eq('asset_id', resolvedAssetId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      if (latestPrice) {
        priceAtAdd = Number(latestPrice.price_usd)
      }
    } catch {
      // Best-effort — don't block the add
    }
  }

  // Check for duplicate holding (same user + same asset)
  if (symbol) {
    const { data: existing } = await supabase
      .from('portfolio_holdings')
      .select('id')
      .eq('user_id', user.id)
      .ilike('asset', symbol)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `You already hold ${symbol}. Edit the existing holding instead.` },
        { status: 409 },
      )
    }
  }

  // Insert — bidirectional trigger fills asset↔asset_id
  const { data: holding, error } = await supabase
    .from('portfolio_holdings')
    .insert({
      user_id: user.id,
      asset: symbol,
      asset_id: resolvedAssetId,
      quantity: Number(quantity),
      cost_basis: cost_basis != null ? Number(cost_basis) : null,
      include_in_exposure: true,
      price_at_add: priceAtAdd,
    })
    .select(`
      id,
      user_id,
      asset,
      asset_id,
      quantity,
      cost_basis,
      price_at_add,
      include_in_exposure,
      created_at,
      updated_at,
      asset_mapping (
        id,
        symbol,
        name,
        icon_url,
        category,
        subcategory,
        coingecko_id,
        rank
      )
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to add holding' }, { status: 500 })
  }

  return NextResponse.json({ holding }, { status: 201 })
}