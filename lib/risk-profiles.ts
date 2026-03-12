// lib/risk-profiles.ts
// Version: 2.0.0
// Date: 2026-03-12
// Changelog:
//   v2.0.0 — S195: Data-grounded band revision.
//             Range no longer clones Bull. insufficient_data widened (~2× band spans).
//             Bull ETH ceiling raised (ETH outperforms BTC +17–30% in bull, 90d window).
//             Bear neutral BTC floor raised (dominance spikes in bear).
//             Conservative bear BTC floor intentionally lower than neutral (max stable over BTC).
//             Basis: market_regimes DB (393 days, Feb 2025–Mar 2026) + CoinGecko 200d returns.
//   v1.0.0 — S142: Initial target bands per profile × regime × bucket
// No DB reads — pure constants

// 1.0 Types

export type RiskProfile = 'aggressive' | 'neutral' | 'conservative'
export type RegimeKey = 'bull' | 'bear' | 'range' | 'volatility' | 'insufficient_data'

export interface TargetBands {
  btc: [number, number]   // [min%, max%]
  eth: [number, number]
  alt: [number, number]
  stable: [number, number]
}

// 2.0 Target Bands
//
// Matrix: 5 regimes × 3 profiles = 15 cells
//
// BULL  — ETH/alt opportunity window; BTC floor lower as capital rotates out
// RANGE — BTC consolidates; ETH relative strength persists; alts high dispersion
// BEAR  — BTC dominance spikes; ETH bleeds faster than BTC; alts destroyed
// VOL   — Bear-adjacent; asymmetric downside; treated conservatively (thin sample, 8 days)
// INSUF — Wide bands; no penalty for unclassified regime (classifier has no signal)

const PROFILES: Record<RiskProfile, Record<RegimeKey, TargetBands>> = {
  aggressive: {
    bull:              { btc: [25, 45], eth: [20, 35], alt: [20, 40], stable: [0,  10] },
    range:             { btc: [30, 50], eth: [15, 28], alt: [15, 28], stable: [5,  18] },
    bear:              { btc: [40, 60], eth: [10, 20], alt: [5,  15], stable: [15, 35] },
    volatility:        { btc: [35, 55], eth: [10, 20], alt: [5,  15], stable: [15, 30] },
    insufficient_data: { btc: [25, 55], eth: [8,  30], alt: [8,  30], stable: [5,  25] },
  },
  neutral: {
    bull:              { btc: [30, 50], eth: [15, 30], alt: [15, 25], stable: [5,  15] },
    range:             { btc: [35, 52], eth: [12, 22], alt: [8,  18], stable: [12, 25] },
    bear:              { btc: [42, 58], eth: [8,  18], alt: [3,  10], stable: [22, 40] },
    volatility:        { btc: [40, 58], eth: [8,  18], alt: [3,  10], stable: [20, 35] },
    insufficient_data: { btc: [28, 55], eth: [8,  25], alt: [5,  22], stable: [10, 30] },
  },
  conservative: {
    bull:              { btc: [40, 55], eth: [10, 20], alt: [5,  15], stable: [15, 30] },
    range:             { btc: [38, 55], eth: [8,  18], alt: [3,  10], stable: [22, 38] },
    bear:              { btc: [35, 52], eth: [5,  15], alt: [0,  5],  stable: [35, 55] },
    volatility:        { btc: [40, 55], eth: [5,  15], alt: [0,  5],  stable: [30, 50] },
    insufficient_data: { btc: [30, 55], eth: [5,  20], alt: [3,  15], stable: [20, 45] },
  },
}

// 3.0 Resolver — null profile → Neutral

export function getTargetBands(
  profile: RiskProfile | null,
  regime: RegimeKey
): TargetBands {
  const resolved: RiskProfile = profile ?? 'neutral'
  return PROFILES[resolved][regime]
}

export function resolveProfile(profile: RiskProfile | null): RiskProfile {
  return profile ?? 'neutral'
}

export { PROFILES }