// ━━━ Static Demo Data ━━━
// v0.3.1 · ca-story12 · 2026-02-11
// 3 scenarios for prototype testing. API layer replaces this in v0.4.

import type { RegimeData, PortfolioData, Signal, MarketMetrics } from '@/types';
import { M } from '@/lib/meridian';

// ━━━ SCENARIO TYPE ━━━

export type ScenarioId = 'bull' | 'bear' | 'sideways';

export interface Scenario {
  id: ScenarioId;
  label: string;
  regime: RegimeData;
  portfolio: PortfolioData;
  signals: Signal[];
  metrics: MarketMetrics;
}

// ━━━ SCENARIO 1: BULL MARKET (Default) ━━━

const bullScenario: Scenario = {
  id: 'bull',
  label: '🟢 Bull Market',
  regime: {
    current: 'Bull Market',
    confidence: 87,
    persistence: 14,
    trend: '+12.5%',
    volume: 'High',
    volatility: '42%',
  },
  portfolio: {
    posture: 'Aligned',
    misalignment: 8,
    allocations: [
      { asset: 'BTC', current: 45, target: 50 },
      { asset: 'ETH', current: 25, target: 25 },
      { asset: 'ALTS', current: 20, target: 15 },
      { asset: 'STABLE', current: 10, target: 10 },
    ],
  },
  signals: [
    {
      id: 1,
      asset: 'BTC',
      action: 'BUY',
      severity: 78,
      reason: 'Strong uptrend + low misalignment',
      time: '2h ago',
    },
    {
      id: 2,
      asset: 'ETH',
      action: 'HOLD',
      severity: 45,
      reason: 'Regime aligned, moderate confidence',
      time: '2h ago',
    },
    {
      id: 3,
      asset: 'SOL',
      action: 'BUY',
      severity: 62,
      reason: 'ALT season indicators positive',
      time: '2h ago',
    },
  ],
  metrics: {
    fearGreed: 68,
    fearGreedLabel: 'Greed',
    btcDominance: 52.3,
    altSeason: 72,
  },
};

// ━━━ SCENARIO 2: BEAR MARKET ━━━

const bearScenario: Scenario = {
  id: 'bear',
  label: '🔴 Bear Market',
  regime: {
    current: 'Bear Market',
    confidence: 72,
    persistence: 21,
    trend: '-18.3%',
    volume: 'Low',
    volatility: '68%',
  },
  portfolio: {
    posture: 'Misaligned',
    misalignment: 34,
    allocations: [
      { asset: 'BTC', current: 35, target: 30 },
      { asset: 'ETH', current: 20, target: 15 },
      { asset: 'ALTS', current: 25, target: 10 },
      { asset: 'STABLE', current: 20, target: 45 },
    ],
  },
  signals: [
    {
      id: 1,
      asset: 'BTC',
      action: 'SELL',
      severity: 82,
      reason: 'Prolonged downtrend + high volatility',
      time: '1h ago',
    },
    {
      id: 2,
      asset: 'ETH',
      action: 'SELL',
      severity: 71,
      reason: 'Breaking key support, regime bearish',
      time: '1h ago',
    },
    {
      id: 3,
      asset: 'SOL',
      action: 'HOLD',
      severity: 55,
      reason: 'Relative strength vs market, monitor',
      time: '1h ago',
    },
  ],
  metrics: {
    fearGreed: 22,
    fearGreedLabel: 'Extreme Fear',
    btcDominance: 58.7,
    altSeason: 28,
  },
};

// ━━━ SCENARIO 3: SIDEWAYS ━━━

const sidewaysScenario: Scenario = {
  id: 'sideways',
  label: '🟡 Sideways',
  regime: {
    current: 'Sideways',
    confidence: 65,
    persistence: 8,
    trend: '+1.2%',
    volume: 'Medium',
    volatility: '31%',
  },
  portfolio: {
    posture: 'Aligned',
    misalignment: 12,
    allocations: [
      { asset: 'BTC', current: 40, target: 40 },
      { asset: 'ETH', current: 22, target: 20 },
      { asset: 'ALTS', current: 18, target: 15 },
      { asset: 'STABLE', current: 20, target: 25 },
    ],
  },
  signals: [
    {
      id: 1,
      asset: 'BTC',
      action: 'HOLD',
      severity: 40,
      reason: 'Range-bound, waiting for breakout',
      time: '3h ago',
    },
    {
      id: 2,
      asset: 'ETH',
      action: 'HOLD',
      severity: 38,
      reason: 'Consolidating near support',
      time: '3h ago',
    },
    {
      id: 3,
      asset: 'SOL',
      action: 'HOLD',
      severity: 42,
      reason: 'Low conviction, no clear signal',
      time: '3h ago',
    },
  ],
  metrics: {
    fearGreed: 50,
    fearGreedLabel: 'Neutral',
    btcDominance: 54.1,
    altSeason: 48,
  },
};

// ━━━ EXPORTS ━━━

export const scenarios: Record<ScenarioId, Scenario> = {
  bull: bullScenario,
  bear: bearScenario,
  sideways: sidewaysScenario,
};

export const defaultScenario: ScenarioId = 'bull';

// Backward-compatible named exports (used by page.tsx)
export const regimeData = bullScenario.regime;
export const portfolioData = bullScenario.portfolio;
export const signalsData = bullScenario.signals;
export const marketMetrics = bullScenario.metrics;

// Derived market pulse cards for rendering
export function getMarketPulseCards(metrics: MarketMetrics = bullScenario.metrics) {
  return [
    {
      label: 'Fear & Greed',
      value: metrics.fearGreed,
      sub: metrics.fearGreedLabel,
      color: metrics.fearGreed > 50 ? M.positive : M.negative,
    },
    {
      label: 'BTC Dominance',
      value: `${metrics.btcDominance}%`,
      sub: null,
      color: M.textSecondary,
    },
    {
      label: 'ALT Season',
      value: metrics.altSeason,
      sub: metrics.altSeason > 60 ? 'Active' : metrics.altSeason > 40 ? 'Neutral' : 'Inactive',
      color: metrics.altSeason > 60 ? M.accent : metrics.altSeason > 40 ? M.textSecondary : M.negative,
    },
    {
      label: 'Volume Profile',
      value: metrics.fearGreed > 50 ? 'High' : metrics.fearGreed > 30 ? 'Medium' : 'Low',
      sub: metrics.fearGreed > 50 ? 'Above avg' : metrics.fearGreed > 30 ? 'Average' : 'Below avg',
      color: metrics.fearGreed > 50 ? M.positive : metrics.fearGreed > 30 ? M.textSecondary : M.negative,
    },
  ];
}

