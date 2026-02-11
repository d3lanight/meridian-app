#!/bin/bash
# ━━━ Story 11 + 12 Integration Script ━━━
# v0.3.1 · 2026-02-11
# Run from meridian-app root: bash integrate-story11-12.sh

set -e

echo "━━━ Meridian · Story 11 + 12 Integration ━━━"
echo ""

# ── 1. Create directory structure ──
echo "📁 Creating directories..."
mkdir -p types
mkdir -p lib
mkdir -p hooks
mkdir -p app/\(protected\)/dashboard
mkdir -p components/brand
mkdir -p components/regime
mkdir -p components/portfolio
mkdir -p components/signals
mkdir -p components/market
mkdir -p components/navigation
mkdir -p components/dev

echo "✅ Directories created"
echo ""

# ── 2. Write foundation files ──
echo "📝 Writing foundation files..."

# ── types/index.ts ──
cat > 'types/index.ts' << 'FILEOF'
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

FILEOF
echo "  ✓ types/index.ts"

# ── lib/meridian.ts ──
cat > 'lib/meridian.ts' << 'FILEOF'
// ━━━ Meridian Design Tokens ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Centralized token map for inline styles (SVG gradients, etc.)
// Tailwind classes handle most styling via tailwind.config tokens.

export const M = {
  // Backgrounds
  bg: '#0B1120',
  bgGrad: 'linear-gradient(180deg, #0B1120 0%, #0D1526 50%, #0B1120 100%)',
  surface: '#131B2E',
  surfaceHover: '#172036',
  surfaceLight: '#1A2540',
  surfaceElevated: '#16203A',

  // Borders
  border: 'rgba(245, 183, 77, 0.10)',
  borderSubtle: 'rgba(148, 163, 184, 0.08)',

  // Accent
  accent: '#F5B74D',
  accentDim: '#C4923E',
  accentGlow: 'rgba(245, 183, 77, 0.06)',
  accentMuted: 'rgba(245, 183, 77, 0.12)',

  // Semantic
  positive: '#34D399',
  positiveDim: 'rgba(52, 211, 153, 0.12)',
  negative: '#F87171',
  negativeDim: 'rgba(248, 113, 113, 0.12)',
  neutral: '#94A3B8',
  neutralDim: 'rgba(148, 163, 184, 0.10)',

  // Text
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textSubtle: '#475569',
} as const;

FILEOF
echo "  ✓ lib/meridian.ts"

# ── lib/demo-data.ts ──
cat > 'lib/demo-data.ts' << 'FILEOF'
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

FILEOF
echo "  ✓ lib/demo-data.ts"

# ── hooks/useMarketData.ts ──
cat > 'hooks/useMarketData.ts' << 'FILEOF'
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

FILEOF
echo "  ✓ hooks/useMarketData.ts"

# ── 3. Write components ──
echo ""
echo "🧩 Writing components..."

# ── components/brand/MeridianMark.tsx ──
cat > 'components/brand/MeridianMark.tsx' << 'FILEOF'
// ━━━ Meridian Logo Mark ━━━
// v0.3.1 · ca-story11 · 2026-02-11

import { M } from '@/lib/meridian';

interface MeridianMarkProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export default function MeridianMark({
  size = 48,
  color = M.accent,
  opacity = 1,
}: MeridianMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{ opacity }}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="1.5" opacity="0.25" />
      <circle cx="24" cy="24" r="13" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <line x1="24" y1="2" x2="24" y2="46" stroke={color} strokeWidth="1.5" />
      <line x1="12" y1="6" x2="36" y2="42" stroke={color} strokeWidth="1" opacity="0.35" />
      <circle cx="24" cy="24" r="3" fill={color} />
      <circle cx="24" cy="10" r="1.5" fill={color} opacity="0.5" />
      <circle cx="24" cy="38" r="1.5" fill={color} opacity="0.5" />
    </svg>
  );
}

FILEOF
echo "  ✓ components/brand/MeridianMark.tsx"

# ── components/regime/ConfidenceArc.tsx ──
cat > 'components/regime/ConfidenceArc.tsx' << 'FILEOF'
// ━━━ Confidence Arc ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// 270° SVG arc gauge with green→amber gradient
// Pure CSS transition for fill animation

import { M } from '@/lib/meridian';

interface ConfidenceArcProps {
  value?: number;
  size?: number;
}

export default function ConfidenceArc({ value = 87, size = 100 }: ConfidenceArcProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const startAngle = 135;
  const totalAngle = 270;
  const filledAngle = (value / 100) * totalAngle;
  const dashOffset = circumference - (filledAngle / 360) * circumference;
  const trackDash = (totalAngle / 360) * circumference;

  // Unique gradient ID to avoid conflicts if multiple arcs render
  const gradientId = `arcGrad-${size}`;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-label={`Confidence: ${value}%`} role="img">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={M.positive} />
            <stop offset="100%" stopColor={M.accent} />
          </linearGradient>
        </defs>

        {/* Track (background arc) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={M.surfaceLight}
          strokeWidth={strokeWidth}
          strokeDasharray={`${trackDash} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
        />

        {/* Filled arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${trackDash} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span
          className="font-display text-[32px] font-semibold leading-none tracking-tight"
          style={{ color: M.text, letterSpacing: '-0.03em' }}
        >
          {value}
        </span>
        <span
          className="text-[10px] font-medium mt-0.5"
          style={{ color: M.textMuted, letterSpacing: '0.06em' }}
        >
          CONFIDENCE
        </span>
      </div>
    </div>
  );
}

FILEOF
echo "  ✓ components/regime/ConfidenceArc.tsx"

# ── components/regime/RegimeCard.tsx ──
cat > 'components/regime/RegimeCard.tsx' << 'FILEOF'
// ━━━ Regime Card (Hero) ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Top card showing current market regime with confidence arc

import { M } from '@/lib/meridian';
import type { RegimeData } from '@/types';
import ConfidenceArc from './ConfidenceArc';

interface RegimeCardProps {
  data: RegimeData;
}

export default function RegimeCard({ data }: RegimeCardProps) {
  const quickMetrics = [
    { label: 'Trend', value: data.trend, positive: true },
    { label: 'Volume', value: data.volume, positive: true },
    { label: 'Volatility', value: data.volatility, positive: null },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 mb-3"
      style={{
        background: `linear-gradient(135deg, ${M.surfaceElevated} 0%, ${M.surface} 100%)`,
        border: `1px solid ${M.border}`,
      }}
    >
      {/* Background glow */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: '-40px',
          right: '-40px',
          width: '160px',
          height: '160px',
          background: `radial-gradient(circle, ${M.accentGlow}, transparent 70%)`,
        }}
      />

      <div className="relative">
        {/* Top row: regime info + arc */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div
              className="text-[10px] font-semibold font-body mb-2"
              style={{ letterSpacing: '0.1em', color: M.textMuted }}
            >
              CURRENT REGIME
            </div>
            <div
              className="font-display text-[28px] font-semibold leading-tight mb-2"
              style={{ color: M.positive, letterSpacing: '-0.03em' }}
            >
              {data.current}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: M.textMuted }}>
              <span className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: M.positive }}
                />
                {data.persistence} days
              </span>
              <span style={{ color: M.textSubtle }}>·</span>
              <span>{data.trend} (7d)</span>
            </div>
          </div>

          <ConfidenceArc value={data.confidence} size={100} />
        </div>

        {/* Quick metrics row */}
        <div
          className="flex gap-2 mt-4 pt-4"
          style={{ borderTop: `1px solid ${M.borderSubtle}` }}
        >
          {quickMetrics.map((m) => (
            <div
              key={m.label}
              className="flex-1 rounded-[10px] p-2.5 text-center"
              style={{ background: M.surfaceLight }}
            >
              <div
                className="text-[10px] mb-1"
                style={{ color: M.textSubtle, letterSpacing: '0.03em' }}
              >
                {m.label}
              </div>
              <div
                className="font-display text-sm font-semibold"
                style={{
                  color:
                    m.positive === true
                      ? M.positive
                      : m.positive === false
                        ? M.negative
                        : M.textSecondary,
                }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

FILEOF
echo "  ✓ components/regime/RegimeCard.tsx"

# ── components/portfolio/AllocationBar.tsx ──
cat > 'components/portfolio/AllocationBar.tsx' << 'FILEOF'
// ━━━ Allocation Bar ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Single horizontal bar showing current vs target allocation

import { M } from '@/lib/meridian';
import type { Allocation } from '@/types';

interface AllocationBarProps {
  allocation: Allocation;
}

export default function AllocationBar({ allocation }: AllocationBarProps) {
  const { asset, current, target } = allocation;
  const diff = current - target;
  const hasDiff = Math.abs(diff) > 2;

  return (
    <div className="flex items-center gap-2.5">
      <span
        className="w-[42px] text-[11px] font-mono font-medium"
        style={{ color: M.textSecondary }}
      >
        {asset}
      </span>

      <div
        className="relative flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: M.surfaceLight }}
      >
        {/* Filled bar */}
        <div
          className="h-full rounded-full transition-[width] duration-[800ms] ease-out"
          style={{
            width: `${current}%`,
            background: hasDiff
              ? `linear-gradient(90deg, ${M.accent}88, ${M.accent})`
              : `linear-gradient(90deg, ${M.positive}66, ${M.positive})`,
          }}
        />

        {/* Target marker (only shown when misaligned) */}
        {hasDiff && (
          <div
            className="absolute rounded-sm"
            style={{
              top: '-1px',
              left: `${target}%`,
              width: '2px',
              height: '8px',
              background: M.textMuted,
              transform: 'translateX(-1px)',
            }}
          />
        )}
      </div>

      <span
        className="w-8 text-[11px] font-mono font-medium text-right"
        style={{ color: hasDiff ? M.accent : M.textMuted }}
      >
        {current}%
      </span>
    </div>
  );
}

FILEOF
echo "  ✓ components/portfolio/AllocationBar.tsx"

# ── components/portfolio/PostureCard.tsx ──
cat > 'components/portfolio/PostureCard.tsx' << 'FILEOF'
// ━━━ Portfolio Posture Card ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Alignment status + allocation bar breakdown

import { CheckCircle } from 'lucide-react';
import { M } from '@/lib/meridian';
import type { PortfolioData } from '@/types';
import AllocationBar from './AllocationBar';

interface PostureCardProps {
  data: PortfolioData;
}

export default function PostureCard({ data }: PostureCardProps) {
  return (
    <div
      className="rounded-2xl p-5 mb-3"
      style={{
        background: M.surface,
        border: `1px solid ${M.borderSubtle}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div
            className="text-[10px] font-semibold font-body mb-1.5"
            style={{ letterSpacing: '0.1em', color: M.textMuted }}
          >
            PORTFOLIO POSTURE
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-[7px] flex items-center justify-center"
              style={{ background: M.positiveDim }}
            >
              <CheckCircle size={14} color={M.positive} />
            </div>
            <span
              className="font-display text-lg font-semibold"
              style={{ color: M.positive }}
            >
              {data.posture}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div
            className="text-[10px] mb-0.5"
            style={{ color: M.textSubtle, letterSpacing: '0.03em' }}
          >
            Misalignment
          </div>
          <div className="font-display text-xl font-semibold" style={{ color: M.text }}>
            {data.misalignment}
            <span className="text-xs font-normal" style={{ color: M.textMuted }}>
              %
            </span>
          </div>
        </div>
      </div>

      {/* Allocation bars */}
      <div className="flex flex-col gap-2">
        {data.allocations.map((a) => (
          <AllocationBar key={a.asset} allocation={a} />
        ))}
      </div>
    </div>
  );
}

FILEOF
echo "  ✓ components/portfolio/PostureCard.tsx"

# ── components/signals/SignalCard.tsx ──
cat > 'components/signals/SignalCard.tsx' << 'FILEOF'
// ━━━ Signal Card ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Expandable signal card with action icon, severity badge, left accent

'use client';

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, ChevronDown } from 'lucide-react';
import { M } from '@/lib/meridian';
import type { Signal, SignalAction } from '@/types';

// ── Action styling map ──
function getActionStyle(action: SignalAction) {
  if (action === 'BUY') return { bg: M.positiveDim, color: M.positive, Icon: ArrowUpRight };
  if (action === 'SELL') return { bg: M.negativeDim, color: M.negative, Icon: ArrowDownRight };
  return { bg: M.neutralDim, color: M.neutral, Icon: Minus };
}

// ── Severity badge ──
function SeverityIndicator({ severity }: { severity: number }) {
  const color = severity >= 70 ? M.negative : severity >= 50 ? M.accent : M.positive;
  const bgColor = severity >= 70 ? M.negativeDim : severity >= 50 ? M.accentMuted : M.positiveDim;

  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center font-display text-xs font-semibold flex-shrink-0"
      style={{ background: bgColor, color }}
    >
      {severity}
    </div>
  );
}

// ── Main component ──
interface SignalCardProps {
  signal: Signal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = getActionStyle(signal.action);
  const ActionIcon = style.Icon;
  const isHigh = signal.severity >= 70;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left relative overflow-hidden rounded-[14px] transition-colors duration-200"
      style={{
        background: M.surface,
        border: `1px solid ${isHigh ? 'rgba(248, 113, 113, 0.15)' : M.borderSubtle}`,
      }}
      aria-expanded={expanded}
    >
      {/* High severity left accent bar */}
      {isHigh && (
        <div
          className="absolute left-0 rounded-r-sm"
          style={{
            top: '20%',
            bottom: '20%',
            width: '3px',
            background: M.negative,
          }}
        />
      )}

      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Action icon */}
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: style.bg }}
        >
          <ActionIcon size={18} color={style.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="font-display text-[15px] font-semibold"
              style={{ letterSpacing: '-0.01em', color: M.text }}
            >
              {signal.asset}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: style.bg,
                color: style.color,
                letterSpacing: '0.04em',
              }}
            >
              {signal.action}
            </span>
          </div>
          <div
            className="text-xs truncate"
            style={{ color: M.textMuted }}
          >
            {signal.reason}
          </div>
        </div>

        {/* Severity + expand chevron */}
        <div className="flex items-center gap-2">
          <SeverityIndicator severity={signal.severity} />
          <ChevronDown
            size={14}
            color={M.textSubtle}
            className="transition-transform duration-200 flex-shrink-0"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div
          className="px-4 pb-3.5 pt-0"
          style={{ borderTop: `1px solid ${M.borderSubtle}` }}
        >
          <div className="pt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span style={{ color: M.textSubtle }}>Severity</span>
              <div className="font-display font-semibold mt-0.5" style={{ color: M.text }}>
                {signal.severity}/100
              </div>
            </div>
            <div>
              <span style={{ color: M.textSubtle }}>Generated</span>
              <div className="font-display font-semibold mt-0.5" style={{ color: M.text }}>
                {signal.time}
              </div>
            </div>
            <div className="col-span-2">
              <span style={{ color: M.textSubtle }}>Reasoning</span>
              <div className="mt-0.5" style={{ color: M.textSecondary }}>
                {signal.reason}
              </div>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

FILEOF
echo "  ✓ components/signals/SignalCard.tsx"

# ── components/market/MarketPulseCard.tsx ──
cat > 'components/market/MarketPulseCard.tsx' << 'FILEOF'
// ━━━ Market Pulse Card ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// 2×2 grid of market health metrics

import { M } from '@/lib/meridian';

interface PulseMetric {
  label: string;
  value: string | number;
  sub: string | null;
  color: string;
}

interface MarketPulseCardProps {
  metrics: PulseMetric[];
}

export default function MarketPulseCard({ metrics }: MarketPulseCardProps) {
  return (
    <div
      className="rounded-2xl p-5 mb-3"
      style={{
        background: M.surface,
        border: `1px solid ${M.borderSubtle}`,
      }}
    >
      <div
        className="text-[10px] font-semibold font-body mb-3.5"
        style={{ letterSpacing: '0.1em', color: M.textMuted }}
      >
        MARKET PULSE
      </div>

      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-3.5"
            style={{ background: M.surfaceLight }}
          >
            <div
              className="text-[10px] font-medium mb-1.5"
              style={{ color: M.textSubtle, letterSpacing: '0.03em' }}
            >
              {m.label}
            </div>
            <div
              className="font-display text-xl font-semibold leading-tight"
              style={{ color: m.color, letterSpacing: '-0.02em' }}
            >
              {m.value}
            </div>
            {m.sub && (
              <div className="text-[11px] mt-0.5" style={{ color: M.textMuted }}>
                {m.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

FILEOF
echo "  ✓ components/market/MarketPulseCard.tsx"

# ── components/navigation/BottomNav.tsx ──
cat > 'components/navigation/BottomNav.tsx' << 'FILEOF'
// ━━━ Bottom Navigation ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// 4-tab nav with amber active state, radial glow, gradient fade

'use client';

import { Home, Target, Bell, Settings } from 'lucide-react';
import { M } from '@/lib/meridian';
import type { NavTab } from '@/types';

const tabs: { id: NavTab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'portfolio', icon: Target, label: 'Portfolio' },
  { id: 'signals', icon: Bell, label: 'Signals' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[428px]"
      style={{
        background:
          'linear-gradient(180deg, rgba(13,21,38,0.0) 0%, rgba(13,21,38,0.85) 20%, rgba(13,21,38,0.98) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '14px 20px 26px',
      }}
      aria-label="Main navigation"
    >
      {/* Separator line */}
      <div
        className="absolute left-5 right-5"
        style={{
          top: '14px',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${M.border}, transparent)`,
        }}
      />

      <div className="flex justify-around items-center pt-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-[5px] bg-transparent border-none cursor-pointer px-4 py-1 relative transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
            >
              {/* Active radial glow */}
              {isActive && (
                <div
                  className="absolute top-[-2px] left-1/2 -translate-x-1/2 w-9 h-9 rounded-full pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(245, 183, 77, 0.12), transparent 70%)',
                  }}
                />
              )}

              {/* Icon pill */}
              <div
                className="w-9 h-7 rounded-[10px] flex items-center justify-center transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  background: isActive ? 'rgba(245, 183, 77, 0.10)' : 'transparent',
                }}
              >
                <Icon
                  size={19}
                  color={isActive ? '#F5B74D' : '#4A5568'}
                  strokeWidth={isActive ? 2 : 1.5}
                  className="transition-all duration-[250ms] ease-out"
                />
              </div>

              {/* Label */}
              <span
                className="text-[10px] transition-all duration-[250ms] ease-out"
                style={{
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#F5B74D' : '#4A5568',
                  letterSpacing: '0.02em',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

FILEOF
echo "  ✓ components/navigation/BottomNav.tsx"

# ── components/dev/DevTools.tsx ──
cat > 'components/dev/DevTools.tsx' << 'FILEOF'
// ━━━ Dev Tools: Scenario Switcher ━━━
// v0.3.1 · ca-story12 · 2026-02-11
// Floating pill to toggle between demo scenarios. Dev mode only.

'use client';

import { useState } from 'react';
import { Bug, X } from 'lucide-react';
import { M } from '@/lib/meridian';
import { scenarios } from '@/lib/demo-data';
import type { ScenarioId } from '@/lib/demo-data';

interface DevToolsProps {
  activeScenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
}

export default function DevTools({ activeScenario, onScenarioChange }: DevToolsProps) {
  const [open, setOpen] = useState(false);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-3 right-3 z-50">
      {/* Toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border-none cursor-pointer transition-opacity hover:opacity-100 opacity-60"
          style={{
            background: M.surfaceElevated,
            color: M.accent,
            border: `1px solid ${M.border}`,
          }}
          aria-label="Open dev tools"
        >
          <Bug size={12} />
          DEV
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="rounded-xl p-3 min-w-[160px]"
          style={{
            background: M.surfaceElevated,
            border: `1px solid ${M.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] font-semibold"
              style={{ color: M.accent, letterSpacing: '0.08em' }}
            >
              SCENARIO
            </span>
            <button
              onClick={() => setOpen(false)}
              className="bg-transparent border-none cursor-pointer p-0.5"
              aria-label="Close dev tools"
            >
              <X size={12} color={M.textMuted} />
            </button>
          </div>

          {/* Scenario buttons */}
          <div className="flex flex-col gap-1">
            {(Object.values(scenarios)).map((s) => {
              const isActive = s.id === activeScenario;
              return (
                <button
                  key={s.id}
                  onClick={() => onScenarioChange(s.id)}
                  className="text-left px-2.5 py-1.5 rounded-lg text-xs border-none cursor-pointer transition-colors"
                  style={{
                    background: isActive ? M.accentMuted : 'transparent',
                    color: isActive ? M.accent : M.textSecondary,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Version tag */}
          <div
            className="text-[9px] mt-2 pt-2 text-center"
            style={{ color: M.textSubtle, borderTop: `1px solid ${M.borderSubtle}` }}
          >
            v0.3.1 · ca-story12
          </div>
        </div>
      )}
    </div>
  );
}

FILEOF
echo "  ✓ components/dev/DevTools.tsx"

# ── 4. Write app pages ──
echo ""
echo "📱 Writing app pages..."

# ── app/(protected)/layout.tsx ──
cat > 'app/(protected)/layout.tsx' << 'FILEOF'
// ━━━ Protected Layout ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Wraps protected pages with bottom nav. Auth gate added in story14.

'use client';

import { useState } from 'react';
import BottomNav from '@/components/navigation/BottomNav';
import type { NavTab } from '@/types';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  return (
    <div
      className="min-h-screen font-body text-text-primary max-w-[428px] mx-auto relative pb-[88px] overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #0B1120 0%, #0D1526 50%, #0B1120 100%)',
      }}
    >
      {children}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

FILEOF
echo "  ✓ app/(protected)/layout.tsx"

# ── app/(protected)/dashboard/page.tsx ──
cat > 'app/(protected)/dashboard/page.tsx' << 'FILEOF'
// ━━━ Dashboard (Home Screen) ━━━
// v0.3.1 · ca-story12 · 2026-02-11
// Meridian home screen with scenario-aware data hook

'use client';

import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { M } from '@/lib/meridian';
import { useMarketData } from '@/hooks/useMarketData';

import MeridianMark from '@/components/brand/MeridianMark';
import RegimeCard from '@/components/regime/RegimeCard';
import PostureCard from '@/components/portfolio/PostureCard';
import SignalCard from '@/components/signals/SignalCard';
import MarketPulseCard from '@/components/market/MarketPulseCard';
import DevTools from '@/components/dev/DevTools';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const { scenario, activeScenario, setScenario, pulseMetrics } = useMarketData();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Staggered entrance animation helper
  const anim = (i: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
  });

  return (
    <>
      {/* Dev-only scenario switcher */}
      <DevTools activeScenario={activeScenario} onScenarioChange={setScenario} />

      {/* ── Status Bar ── */}
      <div
        className="flex justify-between items-center text-xs font-medium px-5 pt-3"
        style={{ color: M.textMuted }}
      >
        <span>9:41</span>
        <div className="flex gap-1 items-center">
          <div
            className="rounded-sm p-px"
            style={{
              width: '14px',
              height: '10px',
              border: `1px solid ${M.textMuted}`,
            }}
          >
            <div
              className="rounded-[1px]"
              style={{
                width: '70%',
                height: '100%',
                background: M.textMuted,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4" style={anim(0)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MeridianMark size={28} />
            <span
              className="font-display text-lg font-semibold"
              style={{ letterSpacing: '-0.02em', color: M.text }}
            >
              Crypto Analyst
            </span>
          </div>
          <div
            className="text-[11px] font-medium rounded-lg px-2.5 py-[5px]"
            style={{ color: M.textMuted, background: M.surfaceLight }}
          >
            Today, 9:41 AM
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4">
        {/* Regime hero */}
        <div style={anim(1)}>
          <RegimeCard data={scenario.regime} />
        </div>

        {/* Portfolio posture */}
        <div style={anim(2)}>
          <PostureCard data={scenario.portfolio} />
        </div>

        {/* Active signals */}
        <div style={anim(3)} className="mb-3">
          <div className="flex items-center justify-between px-1 mb-2.5">
            <span
              className="text-[10px] font-semibold font-body"
              style={{ letterSpacing: '0.1em', color: M.textMuted }}
            >
              ACTIVE SIGNALS
            </span>
            <button
              className="text-[11px] font-medium flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
              style={{ color: M.accent }}
            >
              View all <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {scenario.signals.map((signal, i) => (
              <div key={signal.id} style={anim(4 + i)}>
                <SignalCard signal={signal} />
              </div>
            ))}
          </div>
        </div>

        {/* Market pulse */}
        <div style={anim(7)}>
          <MarketPulseCard metrics={pulseMetrics} />
        </div>

        {/* Last updated */}
        <div
          className="text-center text-[11px] py-2 pb-4"
          style={{ color: M.textSubtle, ...anim(8) }}
        >
          Last analysis: Today, 9:41 AM · Next in 14h 19m
        </div>
      </div>
    </>
  );
}

FILEOF
echo "  ✓ app/(protected)/dashboard/page.tsx"

# ── 5. Update tailwind.config.js with full Meridian tokens ──
echo ""
echo "🎨 Updating Tailwind config..."

cat > tailwind.config.js << 'TWEOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B1120',
        surface: '#131B2E',
        'surface-light': '#1A2540',
        'surface-elevated': '#16203A',
        accent: '#F5B74D',
        positive: '#34D399',
        negative: '#F87171',
        neutral: '#94A3B8',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        'text-subtle': '#475569',
      },
      fontFamily: {
        display: ['var(--font-outfit)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
TWEOF
echo "  ✓ tailwind.config.js (expanded Meridian tokens)"

# ── 6. Update tsconfig paths ──
echo ""
echo "⚙️  Checking tsconfig paths..."

# Check if @/* path alias exists
if grep -q '"@/\*"' tsconfig.json; then
  echo "  ✓ tsconfig.json paths already configured"
else
  echo "  ⚠ You may need to add path aliases to tsconfig.json:"
  echo '    "paths": { "@/*": ["./*"] }'
fi

# ── 7. Git commit ──
echo ""
echo "📦 Staging and committing..."

git add -A
git commit -m "Story 11 + 12: Meridian components + demo data

- 9 components: RegimeCard, ConfidenceArc, PostureCard, AllocationBar,
  SignalCard, MarketPulseCard, BottomNav, MeridianMark, DevTools
- TypeScript interfaces for all data types
- Meridian design tokens (lib/meridian.ts)
- 3 demo scenarios: bull, bear, sideways
- useMarketData hook with scenario switching
- DevTools scenario switcher (dev only)
- Protected layout with bottom nav
- Dashboard page with staggered animations
- Updated Tailwind config with full Meridian tokens

Stories: ca-story11, ca-story12
Sprint: ca-sprint3"

echo ""
echo "🚀 Pushing to origin/main..."
git push origin main

echo ""
echo "━━━ ✅ Integration complete ━━━"
echo ""
echo "Files added: 16"
echo "Tailwind: Updated with full Meridian tokens"
echo ""
echo "Next steps:"
echo "  1. Wait for Vercel auto-deploy (~60s)"
echo "  2. Check live URL on mobile"
echo "  3. Test scenario switcher in dev mode (npm run dev)"
echo "  4. Mark stories 11 + 12 as Done"
