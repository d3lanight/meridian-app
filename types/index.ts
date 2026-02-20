// ━━━ Crypto Analyst · Meridian Types ━━━
// v0.4.0 · ca-story47 · 2026-02-20
// Changelog (from v0.3.1):
//  - Added EnrichedHolding (cost_basis + category from DB)
//  - Added enriched_holdings to PortfolioExposure

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

export type NavTab = 'home' | 'portfolio' | 'market' | 'settings';

// ━━━ Portfolio Snapshot (ca-story39, updated ca-story47) ━━━

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

export interface EnrichedHolding {
  asset: string;
  quantity: number;
  cost_basis: number | null;
  category: 'core' | 'alt' | 'stable' | null;
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
  enriched_holdings: EnrichedHolding[];
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