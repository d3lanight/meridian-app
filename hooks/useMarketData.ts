// ━━━ Market Data Hook ━━━
// v0.3.1 · ca-story12 · 2026-02-11
// Returns scenario data for prototype. Swap to API in v0.4.

'use client';

import { useState, useCallback, useMemo } from 'react';
import { scenarios, defaultScenario, getMarketPulseCards } from '@/lib/demo-data';
import type { ScenarioId, Scenario } from '@/lib/demo-data';

interface UseMarketDataReturn {
  /** Current scenario data */
  scenario: Scenario;
  /** Active scenario ID */
  activeScenario: ScenarioId;
  /** Switch to a different scenario (dev only) */
  setScenario: (id: ScenarioId) => void;
  /** Derived market pulse cards for rendering */
  pulseMetrics: ReturnType<typeof getMarketPulseCards>;
  /** Available scenario IDs */
  availableScenarios: ScenarioId[];
}

export function useMarketData(): UseMarketDataReturn {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>(defaultScenario);

  const scenario = scenarios[activeScenario];

  const setScenario = useCallback((id: ScenarioId) => {
    setActiveScenario(id);
  }, []);

  const pulseMetrics = useMemo(
    () => getMarketPulseCards(scenario.metrics),
    [scenario.metrics]
  );

  const availableScenarios = useMemo(
    () => Object.keys(scenarios) as ScenarioId[],
    []
  );

  return {
    scenario,
    activeScenario,
    setScenario,
    pulseMetrics,
    availableScenarios,
  };

  // ━━━ v0.4: API Integration ━━━
  // Replace static data with SWR fetch:
  //
  // import useSWR from 'swr';
  // const { data, error } = useSWR('/api/market', fetcher);
  // return data ?? scenarios[defaultScenario];
  //
  // ━━━ v0.5: Real-time ━━━
  // Replace with WebSocket:
  //
  // const { data } = useWebSocket('/api/market/stream');
  // return data ?? scenarios[defaultScenario];
}

