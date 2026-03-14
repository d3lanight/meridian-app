// ━━━ Briefing API ━━━
// v1.2.0 · ca-story235 · 2026-03-14 — add trigger_source to response for debugging
// v1.1.0 · S206 · Sprint 42 — removed dead `revalidate` export (no effect on auth routes)
// v1.0.0 · ca-story200 · 2026-03-12
// GET /api/briefing — returns the current user's AI briefing from agent_briefings cache
// Auth: required — 401 for unauthenticated requests
// Never triggers generation — pipeline-only (ca-flow-phase7.1)
//
// Response:
//   { status: 'ready', content, generated_at, tier, regime_type, regime_window, trigger_source }
//   { status: 'pending', content: null }

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Auth required
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Read user's regime_display_window preference
  const { data: prefRow } = await supabase
    .from('user_preferences')
    .select('value')
    .eq('user_id', user.id)
    .eq('name', 'regime_display_window')
    .single()

  const regimeWindow = parseInt(prefRow?.value ?? '30', 10)

  // Fetch briefing for this user + window
  const { data: briefing, error: briefingError } = await supabase
    .from('agent_briefings')
    .select('content, generated_at, expires_at, tier, regime_type, regime_window, trigger_source')
    .eq('user_id', user.id)
    .eq('regime_window', regimeWindow)
    .single()

  // No row or fetch error — return pending
  if (briefingError || !briefing) {
    return NextResponse.json({ status: 'pending', content: null })
  }

  // Row exists but expired — return pending
  const expiresAt = new Date(briefing.expires_at)
  if (expiresAt <= new Date()) {
    return NextResponse.json({ status: 'pending', content: null })
  }

  // Valid briefing — return content
  return NextResponse.json({
    status: 'ready',
    content: briefing.content,
    generated_at: briefing.generated_at,
    tier: briefing.tier,
    regime_type: briefing.regime_type,
    regime_window: briefing.regime_window,
    trigger_source: briefing.trigger_source,
  })
}