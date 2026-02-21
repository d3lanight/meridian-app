// ============================================================
// Portfolio Holdings API — GET (list) + POST (upsert)
// Story: ca-story48-portfolio-crud-ui
// Version: 1.2 · 2026-02-21
// ============================================================
// Changelog:
//  v1.1 — GET returns cost_basis, POST accepts cost_basis
//  v1.2 — GET returns include_in_exposure, POST accepts include_in_exposure
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Valid asset symbols — validated against asset_mapping table
async function validateAsset(supabase: any, symbol: string): Promise<boolean> {
  const { data } = await supabase
    .from('asset_mapping')
    .select('symbol')
    .eq('symbol', symbol.toUpperCase())
    .eq('active', true)
    .single()
  return !!data
}

// GET /api/portfolio — list user's holdings
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('portfolio_holdings')
    .select('id, asset, quantity, cost_basis, include_in_exposure, timestamp, created_at, updated_at')
    .eq('user_id', user.id)
    .order('asset', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ holdings: data })
}

// POST /api/portfolio — add or update holding (upsert on user_id + asset)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: {
    asset?: string
    quantity?: number
    
    cost_basis?: number | null
    include_in_exposure?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { asset, quantity, cost_basis, include_in_exposure } = body

  // Validate required fields
  if (!asset || typeof asset !== 'string') {
    return NextResponse.json({ error: 'asset is required (string)' }, { status: 400 })
  }
  if (quantity === undefined || typeof quantity !== 'number' || quantity <= 0) {
    return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 })
  }

  // Validate cost_basis if provided
  if (cost_basis !== undefined && cost_basis !== null && (typeof cost_basis !== 'number' || cost_basis < 0)) {
    return NextResponse.json({ error: 'cost_basis must be a non-negative number or null' }, { status: 400 })
  }

  // Validate include_in_exposure if provided
  if (include_in_exposure !== undefined && typeof include_in_exposure !== 'boolean') {
    return NextResponse.json({ error: 'include_in_exposure must be a boolean' }, { status: 400 })
  }

  const symbol = asset.toUpperCase().trim()

  // Validate asset exists in asset_mapping
  const isValid = await validateAsset(supabase, symbol)
  if (!isValid) {
    return NextResponse.json(
      { error: `Unknown asset: ${symbol}. Must exist in asset_mapping.` },
      { status: 400 }
    )
  }

  // Build upsert payload
  const payload: Record<string, any> = {
    user_id: user.id,
    asset: symbol,
    quantity,
    timestamp: new Date().toISOString(),
  }

  // Only include optional fields if explicitly provided
  if (cost_basis !== undefined) {
    payload.cost_basis = cost_basis
  }
  if (include_in_exposure !== undefined) {
    payload.include_in_exposure = include_in_exposure
  }

  // Upsert — ON CONFLICT (user_id, asset) update quantity
  const { data, error } = await supabase
    .from('portfolio_holdings')
    .upsert(payload, { onConflict: 'user_id,asset' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ holding: data }, { status: 201 })
}
