// ━━━ Market Dashboard API ━━━
// v3.2.0 · Sprint 42 — Redis server-side cache (TTL 30s). Supabase only hit on cache miss.
// v3.1.0 · S207-fix · Sprint 42 — swap createClient → createAnonClient
// v3.0.0 · S207 · Sprint 42 — public-only split, Cache-Control header
// v2.3.0 · ca-story97 · 2026-02-28 — Added market_sentiment fetch

import { NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/anon'
import { cacheGet, cacheSet } from '@/lib/redis'
import {
  mapRegime,
  computeMetrics,
  formatLastAnalysis,
} from '@/lib/supabase/queries'

const CACHE_KEY = 'api:market'
const CACHE_TTL = 30 // seconds

// ── Confidence Trend Computation ──────────────

interface ConfidenceTrend {
  direction: 'rising' | 'declining' | 'stable'
  streak: number
}

function computeConfidenceTrend(confidenceValues: number[]): ConfidenceTrend {
  if (confidenceValues.length < 3) {
    return { direction: 'stable', streak: -1 }
  }

  let risingStreak = 0
  let decliningStreak = 0

  for (let i = 0; i < confidenceValues.length - 1; i++) {
    const newer = confidenceValues[i]
    const older = confidenceValues[i + 1]

    if (newer > older) {
      if (decliningStreak > 0) break
      risingStreak++
    } else if (newer < older) {
      if (risingStreak > 0) break
      decliningStreak++
    } else {
      break
    }
  }

  if (risingStreak >= 2) return { direction: 'rising', streak: risingStreak }
  if (decliningStreak >= 2) return { direction: 'declining', streak: decliningStreak }
  return { direction: 'stable', streak: 0 }
}

// ═══════════════════════════════════════════════

export async function GET() {
  // Cache hit — return immediately, no Supabase query
  const cached = await cacheGet<object>(CACHE_KEY)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    })
  }

  // Cache miss — fetch from Supabase
  const supabase = createAnonClient()

  const [regimeRes, persistenceRes, trendRes, sentimentRes] = await Promise.all([
    supabase.from('latest_regime').select('*').single(),
    supabase.rpc('regime_persistence_days'),
    supabase
      .from('market_regimes')
      .select('confidence')
      .order('created_at', { ascending: false })
      .limit(7),
    supabase
      .from('market_sentiment')
      .select('fear_greed_value, fear_greed_label, btc_dominance, alt_season_value, alt_season_label, total_volume_usd, market_date')
      .order('market_date', { ascending: false })
      .limit(1)
      .single(),
  ])

  const regimeRaw = regimeRes.data
  if (regimeRaw) {
    regimeRaw._persistence_days = persistenceRes.data ?? 0
  }

  const regime = regimeRaw ? mapRegime(regimeRaw) : null

  const sentimentRow = sentimentRes.data ?? null
  let sentimentFresh = false
  if (sentimentRow?.market_date) {
    const sentimentDate = new Date(sentimentRow.market_date)
    const hoursSince = (new Date().getTime() - sentimentDate.getTime()) / 3600000
    sentimentFresh = hoursSince < 48
  }

  const metrics = computeMetrics(regimeRaw, sentimentFresh ? sentimentRow : null)
  const confidenceValues = (trendRes.data ?? []).map((r: any) => r.confidence as number)
  const confidenceTrend = computeConfidenceTrend(confidenceValues)
  const lastAnalysis = formatLastAnalysis(regimeRaw?.created_at ?? null)

  const payload = {
    regime,
    metrics,
    confidenceTrend,
    lastAnalysis,
    _meta: {
      hasRegime: !!regimeRes.data,
      sentimentFresh,
      sentimentDate: sentimentRow?.market_date ?? null,
      timestamp: new Date().toISOString(),
    },
  }

  await cacheSet(CACHE_KEY, payload, CACHE_TTL)

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
  })
}