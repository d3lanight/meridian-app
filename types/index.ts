// ━━━ Crypto Analyst · Meridian Types ━━━
// v0.3.1 · ca-story11 · 2026-02-11

export interface RegimeData {
  current: string;
  confidence: number;
  persistence: number;
  trend: string;
  volume: string;
  volatility: string;
}

export interface Allocation {
  asset: string;
  current: number;
  target: number;
}

export interface PortfolioData {
  posture: string;
  misalignment: number;
  allocations: Allocation[];
}

export type SignalAction = 'BUY' | 'SELL' | 'HOLD';

export interface Signal {
  id: number;
  asset: string;
  action: SignalAction;
  severity: number;
  reason: string;
  time: string;
}

export interface MarketMetric {
  label: string;
  value: string | number;
  sub: string | null;
  color: string;
}

export interface MarketMetrics {
  fearGreed: number;
  fearGreedLabel: string;
  btcDominance: number;
  altSeason: number;
}

export type NavTab = 'home' | 'portfolio' | 'signals' | 'settings';

