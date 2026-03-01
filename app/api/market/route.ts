// ━━━ Market Dashboard API ━━━
// v2.3.0 · ca-story97 · 2026-02-28
// Single endpoint for all dashboard data
// Changelog (from v2.2.0):
//   - Added market_sentiment fetch for real Fear & Greed, BTC Dominance, ALT Season
//   - computeMetrics now receives sentiment row, uses real data with fallback

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

  const { data: { user } } = await supabase.auth.getUser()

  // Parallel fetch all data (S97: added sentiment)
  const [regimeRes, exposureRes, signalsRes, persistenceRes, trendRes, sentimentRes] = await Promise.all([
    supabase.from('latest_regime').select('*').single(),
    user ? supabase.from('latest_exposure').select('*').eq('user_id', user.id).single() : Promise.resolve({ data: null, error: null }),
    user ? supabase.from('active_signals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5) : Promise.resolve({ data: null, error: null }),
    supabase.rpc('regime_persistence_days'),
    // S55: Fetch last 7 confidence values for trend computation
    supabase
      .from('market_regimes')
      .select('confidence')
      .order('created_at', { ascending: false })
      .limit(7),
    // S97: Fetch latest sentiment row
    supabase
      .from('market_sentiment')
      .select('fear_greed_value, fear_greed_label, btc_dominance, alt_season_value, alt_season_label, total_volume_usd, market_date')
      .order('market_date', { ascending: false })
      .limit(1)
      .single(),
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

  // S97: Check sentiment freshness (stale if > 48h old)
  const sentimentRow = sentimentRes.data ?? null
  let sentimentFresh = false
  if (sentimentRow?.market_date) {
    const sentimentDate = new Date(sentimentRow.market_date)
    const now = new Date()
    const hoursSince = (now.getTime() - sentimentDate.getTime()) / 3600000
    sentimentFresh = hoursSince < 48
  }

  // Compute market metrics — pass real sentiment if fresh
  const metrics = computeMetrics(regimeRaw, sentimentFresh ? sentimentRow : null)

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
      sentimentFresh,
      sentimentDate: sentimentRow?.market_date ?? null,
      timestamp: new Date().toISOString(),
    },
  })
}