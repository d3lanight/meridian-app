// lib/risk-profiles.ts
// S142 — Risk Profile Constants
// Version: 1.0.0
// Date: 2026-03-02
// Hardcoded target bands per profile × regime × bucket
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

const PROFILES: Record<RiskProfile, Record<RegimeKey, TargetBands>> = {
  aggressive: {
    bull:              { btc: [30, 50], eth: [15, 25], alt: [20, 35], stable: [0,  10] },
    bear:              { btc: [40, 60], eth: [10, 20], alt: [5,  15], stable: [20, 40] },
    range:             { btc: [30, 50], eth: [10, 20], alt: [15, 30], stable: [10, 20] },
    volatility:        { btc: [35, 55], eth: [10, 20], alt: [5,  15], stable: [15, 30] },
    insufficient_data: { btc: [30, 50], eth: [10, 20], alt: [10, 25], stable: [10, 25] },
  },
  neutral: {
    bull:              { btc: [35, 50], eth: [15, 25], alt: [10, 20], stable: [5,  15] },
    bear:              { btc: [40, 55], eth: [10, 20], alt: [5,  10], stable: [25, 40] },
    range:             { btc: [35, 50], eth: [10, 20], alt: [10, 20], stable: [15, 25] },
    volatility:        { btc: [40, 55], eth: [10, 20], alt: [5,  10], stable: [20, 35] },
    insufficient_data: { btc: [35, 50], eth: [10, 20], alt: [10, 20], stable: [15, 25] },
  },
  conservative: {
    bull:              { btc: [40, 55], eth: [10, 20], alt: [5,  10], stable: [20, 35] },
    bear:              { btc: [35, 50], eth: [5,  15], alt: [0,  5],  stable: [35, 55] },
    range:             { btc: [35, 50], eth: [10, 15], alt: [5,  10], stable: [25, 40] },
    volatility:        { btc: [40, 55], eth: [5,  15], alt: [0,  5],  stable: [30, 50] },
    insufficient_data: { btc: [35, 50], eth: [5,  15], alt: [5,  10], stable: [25, 40] },
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