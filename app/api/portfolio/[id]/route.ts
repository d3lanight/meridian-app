// ============================================================
// Portfolio Holdings API — PUT (update) + DELETE (remove)
// Story: ca-story17-portfolio-management-api
// Version: 1.0 · 2026-02-14
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

// PUT /api/portfolio/:id — update quantity
export async function PUT(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: { quantity?: number; name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { quantity, name } = body

  // At least one field to update
  if (quantity === undefined && name === undefined) {
    return NextResponse.json({ error: 'Provide quantity and/or name to update' }, { status: 400 })
  }

  if (quantity !== undefined && (typeof quantity !== 'number' || quantity <= 0)) {
    return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 })
  }

  // Build update payload
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (quantity !== undefined) updates.quantity = quantity
  if (name !== undefined) updates.name = name

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
