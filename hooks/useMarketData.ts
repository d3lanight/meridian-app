// ━━━ Market Data Hook ━━━
// v0.4.0 · ca-story18 · 2026-02-14
// Fetches live data from /api/market, falls back to demo data.
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
      const fallback = scenarios[defaultScenario]
      return {
        id: 'bull' as ScenarioId, // closest match for type compat
        label: '🟢 Live Data',
        regime: liveData.regime ?? fallback.regime,
        portfolio: liveData.portfolio,
        signals: liveData.signals.length > 0 ? liveData.signals : fallback.signals,
        metrics: liveData.metrics,
      }
    }
    // Demo scenario
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
