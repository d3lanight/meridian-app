// ============================================================
// Portfolio Holdings API — PUT (update) + DELETE (remove)
// Story: ca-story47-holdings-data-model
// Version: 1.1 · 2026-02-20
// ============================================================
// Changelog (from v1.0):
//  - PUT accepts optional cost_basis (nullable numeric)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

// PUT /api/portfolio/:id — update quantity and/or cost_basis
export async function PUT(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: { quantity?: number; name?: string; cost_basis?: number | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { quantity, name, cost_basis } = body

  // At least one field to update
  if (quantity === undefined && name === undefined && cost_basis === undefined) {
    return NextResponse.json({ error: 'Provide quantity, name, and/or cost_basis to update' }, { status: 400 })
  }

  if (quantity !== undefined && (typeof quantity !== 'number' || quantity <= 0)) {
    return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 })
  }

  if (cost_basis !== undefined && cost_basis !== null && (typeof cost_basis !== 'number' || cost_basis < 0)) {
    return NextResponse.json({ error: 'cost_basis must be a non-negative number or null' }, { status: 400 })
  }

  // Build update payload
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (quantity !== undefined) updates.quantity = quantity
  if (name !== undefined) updates.name = name
  if (cost_basis !== undefined) updates.cost_basis = cost_basis

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