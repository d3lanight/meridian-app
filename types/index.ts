// ━━━ Crypto Analyst · Meridian Types ━━━
// v0.6.0 · ca-story52 · 2026-02-21
// Changelog:
//  v0.4.0 — Added EnrichedHolding, enriched_holdings on PortfolioExposure
//  v0.5.0 — Added include_in_exposure to EnrichedHolding, Holding type for CRUD
//  v0.6.0 — Added name to AssetMapping, HeldAssetPrice type for market context

export interface RegimeData {
  current: string;
  confidence: number;
  persistence: number;
  trend: string;
  dailyShift: string;  // was: volume (renamed — this is r_1d buckets, not trading volume)
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
  totalVolume: number | null;
}

export type NavTab = 'home' | 'portfolio' | 'market' | 'profile';

// ━━━ Portfolio Snapshot (ca-story39, updated ca-story47, ca-story48) ━━━

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
  include_in_exposure: boolean;
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

// ━━━ Portfolio CRUD (ca-story48) ━━━

export interface Holding {
  id: string;
  asset: string;
  quantity: number;
  cost_basis: number | null;
  include_in_exposure: boolean;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface AssetMapping {
  id: string;
  symbol: string;
  name: string | null;
  coingecko_id: string | null;
  category: 'core' | 'alt' | 'stable' | null;
  active: boolean;
}

export interface HeldAssetPrice {
  symbol: string;
  name: string;
  category: 'core' | 'alt' | 'stable';
  price_usd: number;
  depeg: boolean;
}