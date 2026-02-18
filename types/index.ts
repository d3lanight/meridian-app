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


// ━━━ Portfolio Snapshot (ca-story39) ━━━
export interface AltHolding {
  asset: string;
  quantity: number;
  coingecko_id?: string;
  usd_price: number;
  value_usd: number;
}

export interface CoreHolding {
  asset: string;
  quantity: number;
  usd_price: number;
  value_usd: number;
}

export interface PortfolioExposure {
  isEmpty: boolean;
  btc_weight_all: number;
  eth_weight_all: number;
  alt_weight_all: number;
  btc_value_usd: number;
  eth_value_usd: number;
  alt_value_usd: number;
  alt_count: number;
  alt_unpriced: string;
  alt_breakdown: AltHolding[];
  total_value_usd_all: number;
  holdings_count: number;
  holdings_json: CoreHolding[];
  timestamp: string | null;
}

export interface DisplayHolding {
  asset: string;
  quantity: number;
  usd_price: number;
  value_usd: number;
  category: 'BTC' | 'ETH' | 'ALT';
  weight: number;
}
