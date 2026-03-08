// ━━━ RegimeIcon ━━━
// v2.0.0 · S174 · Sprint 35
// SVG icons for all regimes (no emoji, cross-browser safe).
// Exports RC, getRegime, RegimeColors as single source of truth.
// Changelog:
//   v2.0.0 — S174: Replace Unicode arrows with inline SVG for range + volatility.
//            Export RC, getRegime, RegimeColors for shared use.
//            Props: regime (required), size (default 20), color (default "white").
//            Unknown regime returns null.
//   v1.1.0 — S100: Text arrows (↗↘↕→)
//   v1.0.0 — Initial

'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

// ── Regime colour constants ─────────────────────────────────────────────────

export interface RegimeColors {
  label: string
  color: string
  dim: string
  glow: string
  bg: string
}

export const RC: Record<string, RegimeColors> = {
  bull: {
    label: 'Bull',
    color: '#2A9D8F',
    dim: 'rgba(42,157,143,0.1)',
    glow: 'rgba(42,157,143,0.3)',
    bg: 'linear-gradient(135deg,#2A9D8F,#3DB8A9)',
  },
  bear: {
    label: 'Bear',
    color: '#E76F51',
    dim: 'rgba(231,111,81,0.1)',
    glow: 'rgba(231,111,81,0.3)',
    bg: 'linear-gradient(135deg,#E76F51,#F08C70)',
  },
  range: {
    label: 'Range',
    color: '#5B7FA6',
    dim: 'rgba(91,127,166,0.12)',
    glow: 'rgba(91,127,166,0.2)',
    bg: 'linear-gradient(135deg,#5B7FA6,#7299BE)',
  },
  volatility: {
    label: 'Volatile',
    color: '#D4A017',
    dim: 'rgba(212,160,23,0.12)',
    glow: 'rgba(212,160,23,0.3)',
    bg: 'linear-gradient(135deg,#D4A017,#E0B030)',
  },
}

export function getRegime(r: string): RegimeColors {
  return RC[r?.toLowerCase()] ?? RC.range
}

// ── SVG icons ───────────────────────────────────────────────────────────────

function RangeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* horizontal double arrow */}
      <path d="M3 10h14M3 10l3-3M3 10l3 3M17 10l-3-3M17 10l-3 3" />
    </svg>
  )
}

function VolatilityIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* vertical double arrow */}
      <path d="M10 3v14M10 3l-3 3M10 3l3 3M10 17l-3-3M10 17l3-3" />
    </svg>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

interface RegimeIconProps {
  regime: string
  size?: number
  color?: string
}

export default function RegimeIcon({
  regime,
  size = 20,
  color = 'white',
}: RegimeIconProps) {
  const key = regime?.toLowerCase()

  if (key === 'bull') {
    return <TrendingUp size={size} color={color} strokeWidth={2.5} />
  }
  if (key === 'bear') {
    return <TrendingDown size={size} color={color} strokeWidth={2.5} />
  }
  if (key === 'range') {
    return <RangeIcon size={size} color={color} />
  }
  if (key === 'volatility') {
    return <VolatilityIcon size={size} color={color} />
  }

  return null
}
