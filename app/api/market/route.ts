// ============================================================
// Market Dashboard API — single endpoint for all dashboard data
// Story: ca-story38-daily-overview-real-data
// Version: 1.1 · 2026-02-17
// ============================================================
// Changelog (from v1.0):
//  - Added regime_persistence_days() RPC call for accurate day count
//  - Injects persistence into regime row before mapRegime

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  mapRegime,
  mapExposure,
  emptyExposure,
  mapSignals,
  computeMetrics,
  formatLastAnalysis,
} from '@/lib/supabase/queries'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parallel fetch all data
  const [regimeRes, exposureRes, signalsRes, persistenceRes] = await Promise.all([
    supabase.from('latest_regime').select('*').single(),
    supabase.from('latest_exposure').select('*').eq('user_id', user.id).single(),
    supabase.from('active_signals').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }).limit(5),
    supabase.rpc('regime_persistence_days'),
  ])

  // Inject persistence into regime row before mapping
  const regimeRaw = regimeRes.data
  if (regimeRaw) {
    regimeRaw._persistence_days = persistenceRes.data ?? 0
  }

  // Map regime (always present or fallback)
  const regime = regimeRaw ? mapRegime(regimeRaw) : null

  // Map exposure (may not exist for new users)
  const portfolio = exposureRes.data ? mapExposure(exposureRes.data) : emptyExposure()

  // Map signals (may be empty)
  const signals = signalsRes.data ? mapSignals(signalsRes.data) : []

  // Compute market metrics from live data
  const metrics = computeMetrics(regimeRaw, null)

  // Latest timestamp from regime or exposure
  const latestTimestamp = regimeRaw?.timestamp ?? exposureRes.data?.timestamp ?? null
  const lastAnalysis = formatLastAnalysis(latestTimestamp)

  return NextResponse.json({
    regime,
    portfolio,
    signals,
    metrics,
    lastAnalysis,
    _meta: {
      hasRegime: !!regimeRes.data,
      hasExposure: !!exposureRes.data,
      signalCount: signals.length,
      timestamp: new Date().toISOString(),
    },
  })
}