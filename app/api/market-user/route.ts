// ━━━ Market User API ━━━
// v1.0.0 · S207 · Sprint 42
// Per-user portfolio exposure and active signals.
// Split from /api/market (v3.0.0) to allow public market data to be cached at CDN level.
// Auth: required — 401 for unauthenticated requests

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapExposure, emptyExposure, mapSignals } from '@/lib/supabase/queries'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [exposureRes, signalsRes] = await Promise.all([
    supabase.from('latest_exposure').select('*').eq('user_id', user.id).single(),
    supabase.from('active_signals').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(5),
  ])

  const portfolio = exposureRes.data ? mapExposure(exposureRes.data) : emptyExposure()
  const signals = signalsRes.data ? mapSignals(signalsRes.data) : []

  return NextResponse.json({ portfolio, signals })
}