// ━━━ Briefing Trigger API ━━━
// v1.0.0 · ca-story236 · 2026-03-15
// POST /api/briefing/trigger — silently triggers a fresh Pro briefing on login
// Auth: required — 401 for unauthenticated
// Pro gate — 403 for free tier
//
// Rate gate: if a briefing was generated within the last 30 minutes, returns
//   { status: 'fresh' } and skips generation to avoid duplicate calls on rapid re-login.
//
// On success: fires generate-briefing edge function (fire-and-forget) and returns
//   { status: 'triggered' } immediately — does not block on edge function completion.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()

  // Auth required
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Pro gate
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  if (profile?.tier !== 'pro') {
    return NextResponse.json({ error: 'Pro required' }, { status: 403 })
  }

  // Read regime_display_window preference
  const { data: prefRow } = await supabase
    .from('user_preferences')
    .select('value')
    .eq('user_id', user.id)
    .eq('name', 'regime_display_window')
    .maybeSingle()

  const regimeWindow = parseInt(prefRow?.value ?? '30', 10)

  // Rate gate — skip if briefing generated within last 30 minutes
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data: recentBriefing } = await supabase
    .from('agent_briefings')
    .select('generated_at')
    .eq('user_id', user.id)
    .eq('regime_window', regimeWindow)
    .gte('generated_at', cutoff)
    .maybeSingle()

  if (recentBriefing) {
    return NextResponse.json({ status: 'fresh' })
  }

  // Fire generate-briefing edge function — fire and forget
  const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-briefing`
  fetch(edgeFnUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: user.id,
      regime_window: regimeWindow,
      trigger_source: 'login',
    }),
  }).catch((err) => {
    console.error('[/api/briefing/trigger] edge function fire failed:', err)
  })

  return NextResponse.json({ status: 'triggered' })
}