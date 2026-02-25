// ━━━ Market Dashboard API ━━━
// v2.2.0 · ca-story55 · 2026-02-24
// Single endpoint for all dashboard data
// Changelog (from v2.1.0):
//   - Added confidence_trend computation from last 7 regime rows
//   - Returns { direction: 'rising'|'declining'|'stable', streak: number }

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

// ── Confidence Trend Computation ──────────────

interface ConfidenceTrend {
  direction: 'rising' | 'declining' | 'stable'
  streak: number
}

function computeConfidenceTrend(confidenceValues: number[]): ConfidenceTrend {
  // streak -1 = not enough data (hides indicator), 0 = stable (shows "Stable")
  if (confidenceValues.length < 3) {
    return { direction: 'stable', streak: -1 }
  }

  // Values are ordered newest-first (DESC). Walk from newest back.
  // Compare each pair: values[i] vs values[i+1] (newer vs older)
  let risingStreak = 0
  let decliningStreak = 0

  for (let i = 0; i < confidenceValues.length - 1; i++) {
    const newer = confidenceValues[i]
    const older = confidenceValues[i + 1]

    if (newer > older) {
      // Rising (newer is higher than older)
      if (decliningStreak > 0) break // streak broken
      risingStreak++
    } else if (newer < older) {
      // Declining (newer is lower than older)
      if (risingStreak > 0) break // streak broken
      decliningStreak++
    } else {
      // Equal — breaks any streak
      break
    }
  }

  if (risingStreak >= 2) {
    return { direction: 'rising', streak: risingStreak }
  }
  if (decliningStreak >= 2) {
    return { direction: 'declining', streak: decliningStreak }
  }
  return { direction: 'stable', streak: 0 }
}

// ═══════════════════════════════════════════════

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parallel fetch all data
  const [regimeRes, exposureRes, signalsRes, persistenceRes, trendRes] = await Promise.all([
    supabase.from('latest_regime').select('*').single(),
    supabase.from('latest_exposure').select('*').eq('user_id', user.id).single(),
    supabase.from('active_signals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.rpc('regime_persistence_days'),
    // S55: Fetch last 7 confidence values for trend computation
    supabase
      .from('market_regimes')
      .select('confidence')
      .order('created_at', { ascending: false })
      .limit(7),
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

  // S55: Compute confidence trend
  const confidenceValues = (trendRes.data ?? []).map((r: any) => r.confidence as number)
  const confidenceTrend = computeConfidenceTrend(confidenceValues)

  // Latest timestamp from regime or exposure (use created_at, not timestamp)
  const latestTimestamp = regimeRaw?.created_at ?? exposureRes.data?.created_at ?? null
  const lastAnalysis = formatLastAnalysis(latestTimestamp)

  return NextResponse.json({
    regime,
    portfolio,
    signals,
    metrics,
    confidenceTrend,
    lastAnalysis,
    _meta: {
      hasRegime: !!regimeRes.data,
      hasExposure: !!exposureRes.data,
      signalCount: signals.length,
      timestamp: new Date().toISOString(),
    },
  })
}