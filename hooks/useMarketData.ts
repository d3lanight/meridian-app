// ━━━ Market Data Hook ━━━
// v0.4.1 · ca-story38 · 2026-02-17
// Fetches live data from /api/market, falls back to demo only on error.
// Changelog (from v0.4.0):
//  - Removed demo signal fallback when live signals array is empty
//  - Removed demo regime fallback when live regime is null (use local fallback)
//  - Empty signals = intentional "no active signals" state, not missing data
'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { scenarios, defaultScenario, getMarketPulseCards } from '@/lib/demo-data'
import type { ScenarioId, Scenario } from '@/lib/demo-data'
import type { RegimeData, PortfolioData, Signal, MarketMetrics } from '@/types'

interface MarketApiResponse {
  regime: RegimeData | null
  portfolio: PortfolioData
  signals: Signal[]
  metrics: MarketMetrics
  lastAnalysis: string
  _meta: {
    hasRegime: boolean
    hasExposure: boolean
    signalCount: number
    timestamp: string
  }
}

interface UseMarketDataReturn {
  scenario: Scenario
  activeScenario: ScenarioId | 'live'
  setScenario: (id: ScenarioId) => void
  pulseMetrics: ReturnType<typeof getMarketPulseCards>
  availableScenarios: ScenarioId[]
  lastAnalysis: string
  isLoading: boolean
  error: string | null
  isLive: boolean
  refresh: () => void
}

// Neutral regime when API returns null (no regime data at all)
const fallbackRegime: RegimeData = {
  current: 'No Data',
  confidence: 0,
  persistence: 0,
  trend: '—',
  dailyShift: '—',
  volatility: '—',
}

export function useMarketData(): UseMarketDataReturn {
  const [activeScenario, setActiveScenario] = useState<ScenarioId | 'live'>('live')
  const [liveData, setLiveData] = useState<MarketApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLive = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/market')
      if (!res.ok) throw new Error(`API ${res.status}`)
      const data: MarketApiResponse = await res.json()
      setLiveData(data)
      setActiveScenario('live')
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch')
      // Fall back to demo on error
      setActiveScenario(defaultScenario)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchLive()
  }, [fetchLive])

  // Switch to demo scenario (dev tools)
  const setScenario = useCallback((id: ScenarioId) => {
    setActiveScenario(id)
  }, [])

  // Build scenario from live data or demo fallback
  const scenario: Scenario = useMemo(() => {
    if (activeScenario === 'live' && liveData) {
      return {
        id: 'bull' as ScenarioId, // closest match for type compat
        label: '🟢 Live Data',
        regime: liveData.regime ?? fallbackRegime,  // FIX: local fallback, not demo
        portfolio: liveData.portfolio,
        signals: liveData.signals,                   // FIX: pass through — empty = no signals
        metrics: liveData.metrics,
      }
    }
    // Demo scenario (error fallback or dev tools)
    const id = activeScenario === 'live' ? defaultScenario : activeScenario
    return scenarios[id]
  }, [activeScenario, liveData])

  const pulseMetrics = useMemo(
    () => getMarketPulseCards(scenario.metrics),
    [scenario.metrics]
  )

  const availableScenarios = useMemo(
    () => Object.keys(scenarios) as ScenarioId[],
    []
  )

  const lastAnalysis = liveData?.lastAnalysis ?? 'No data yet'

  return {
    scenario,
    activeScenario: activeScenario === 'live' ? 'live' : activeScenario,
    setScenario,
    pulseMetrics,
    availableScenarios,
    lastAnalysis,
    isLoading,
    error,
    isLive: activeScenario === 'live' && !!liveData,
    refresh: fetchLive,
  }
}