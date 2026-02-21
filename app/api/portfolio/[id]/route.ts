// ============================================================
// Portfolio Holdings API — PUT (update) + DELETE (remove)
// Story: ca-story48-portfolio-crud-ui
// Version: 1.2 · 2026-02-21
// ============================================================
// Changelog:
//  v1.1 — PUT accepts optional cost_basis
//  v1.2 — PUT accepts optional include_in_exposure
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

// PUT /api/portfolio/:id — update quantity, cost_basis, include_in_exposure
export async function PUT(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: {
    quantity?: number
    
    cost_basis?: number | null
    include_in_exposure?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { quantity, cost_basis, include_in_exposure } = body

  // At least one field to update
  if (quantity === undefined && cost_basis === undefined && include_in_exposure === undefined) {
    return NextResponse.json({ error: 'Provide quantity, cost_basis, and/or include_in_exposure to update' }, { status: 400 })
  }

  if (quantity !== undefined && (typeof quantity !== 'number' || quantity <= 0)) {
    return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 })
  }
  if (cost_basis !== undefined && cost_basis !== null && (typeof cost_basis !== 'number' || cost_basis < 0)) {
    return NextResponse.json({ error: 'cost_basis must be a non-negative number or null' }, { status: 400 })
  }
  if (include_in_exposure !== undefined && typeof include_in_exposure !== 'boolean') {
    return NextResponse.json({ error: 'include_in_exposure must be a boolean' }, { status: 400 })
  }

  // Build update payload
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (quantity !== undefined) updates.quantity = quantity
  if (cost_basis !== undefined) updates.cost_basis = cost_basis
  if (include_in_exposure !== undefined) updates.include_in_exposure = include_in_exposure

  // RLS ensures user can only update their own holdings
  const { data, error } = await supabase
    .from('portfolio_holdings')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Holding not found' }, { status: 404 })
  }

  return NextResponse.json({ holding: data })
}

// DELETE /api/portfolio/:id — remove holding
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS ensures user can only delete their own holdings
  const { error } = await supabase
    .from('portfolio_holdings')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true }, { status: 200 })
}
