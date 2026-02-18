// app/(frontend)/(protected)/market/page.tsx
// v1.0.0 — Story 40: Market Context Screen
// Client component — fetches /api/market-context, renders 4 sections

'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Clock,
  Shield,
  BookOpen,
  Bell,
} from 'lucide-react';
import Link from 'next/link';

// ——— MERIDIAN DESIGN TOKENS ———
const M = {
  bg: '#0B1120',
  bgGrad: 'linear-gradient(180deg, #0B1120 0%, #0D1526 50%, #0B1120 100%)',
  surface: '#131B2E',
  surfaceHover: '#172036',
  surfaceLight: '#1A2540',
  surfaceElevated: '#16203A',
  border: 'rgba(245, 183, 77, 0.10)',
  borderSubtle: 'rgba(148, 163, 184, 0.08)',
  accent: '#F5B74D',
  accentDim: '#C4923E',
  accentGlow: 'rgba(245, 183, 77, 0.06)',
  accentMuted: 'rgba(245, 183, 77, 0.12)',
  positive: '#34D399',
  positiveDim: 'rgba(52, 211, 153, 0.12)',
  negative: '#F87171',
  negativeDim: 'rgba(248, 113, 113, 0.12)',
  neutral: '#94A3B8',
  neutralDim: 'rgba(148, 163, 184, 0.10)',
  blue: '#60A5FA',
  blueDim: 'rgba(96, 165, 250, 0.12)',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textSubtle: '#475569',
  display: "'Outfit', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'DM Mono', monospace",
};

// ——— TYPES ———
interface RegimeRow {
  timestamp: string;
  regime: string;
  previous_regime: string | null;
  regime_changed: boolean;
  confidence: number;
  price_now: number;
  r_1d: number;
  r_7d: number;
  vol_7d: number;
  eth_price_now: number;
  eth_r_7d: number;
  eth_vol_7d: number;
}

interface PriceRow {
  timestamp: string;
  btc_usd: number;
  eth_usd: number;
}

interface MarketContextData {
  regimes: RegimeRow[];
  prices: PriceRow[];
  generated_at: string;
}

// ——— HELPERS ———
function formatUsd(n: number): string {
  return n >= 1000
    ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : `$${n.toFixed(2)}`;
}

function formatPct(n: number): string {
  const pct = n * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function regimeLabel(regime: string): string {
  return regime.charAt(0).toUpperCase() + regime.slice(1);
}

function regimeColor(regime: string): string {
  switch (regime.toLowerCase()) {
    case 'bull': return M.positive;
    case 'bear': return M.negative;
    case 'range': return M.accent;
    default: return M.neutral;
  }
}

function regimeDimColor(regime: string): string {
  switch (regime.toLowerCase()) {
    case 'bull': return M.positiveDim;
    case 'bear': return M.negativeDim;
    case 'range': return M.accentMuted;
    default: return M.neutralDim;
  }
}

function volLevel(vol: number): { label: string; color: string; bg: string } {
  if (vol < 0.015) return { label: 'Low', color: M.positive, bg: M.positiveDim };
  if (vol <= 0.025) return { label: 'Moderate', color: M.accent, bg: M.accentMuted };
  return { label: 'Elevated', color: M.negative, bg: M.negativeDim };
}

function computePersistence(regimes: RegimeRow[]): number {
  if (regimes.length === 0) return 0;
  const current = regimes[0].regime;
  let count = 0;
  for (const r of regimes) {
    if (r.regime === current) count++;
    else break;
  }
  return count;
}

// ——— SPARKLINE ———
function Sparkline({
  data,
  color,
  width = 120,
  height = 32,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
    )
    .join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ——— SKELETON ———
function Skeleton() {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            background: M.surface,
            borderRadius: '16px',
            height: i === 1 ? '180px' : '120px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}

// ——— EMPTY STATE ———
function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      <BarChart3 size={48} color={M.textSubtle} style={{ marginBottom: '12px' }} />
      <p style={{ fontSize: '14px', color: M.textSecondary, margin: 0 }}>
        No market data available
      </p>
      <p style={{ fontSize: '12px', color: M.textMuted, marginTop: '4px' }}>
        Check back when market data starts flowing
      </p>
    </div>
  );
}

// ——— MAIN PAGE ———
export default function MarketContextPage() {
  const [data, setData] = useState<MarketContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/market-context');
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const json: MarketContextData = await res.json();
        setData(json);
      } catch (err) {
        console.error('Market context fetch error:', err);
        setError('Failed to load market data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const animDelay = (i: number) => ({
    opacity: mounted && !loading ? 1 : 0,
    transform: mounted && !loading ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
  });

  // Derived data
  const current = data?.regimes?.[0] ?? null;
  const persistence = data ? computePersistence(data.regimes) : 0;

  // Sparkline data: oldest→newest (reverse the DESC order)
  const btcSparkData = data?.prices
    ? [...data.prices].reverse().map((p) => p.btc_usd)
    : [];
  const ethSparkData = data?.prices
    ? [...data.prices].reverse().map((p) => p.eth_usd)
    : [];

  // 7d change direction
  const btcUp = current ? current.r_7d >= 0 : true;
  const ethUp = current ? current.eth_r_7d >= 0 : true;

  // Volatility
  const btcVol = current ? volLevel(current.vol_7d) : null;
  const ethVol = current ? volLevel(current.eth_vol_7d) : null;

  // Narrative
  const narrative = current
    ? `The market has been in a ${regimeLabel(current.regime)} regime for ${persistence} day${persistence !== 1 ? 's' : ''}. BTC is ${btcUp ? 'up' : 'down'} ${formatPct(current.r_7d)} over the past week at ${formatUsd(current.price_now)}. Volatility is ${btcVol?.label.toLowerCase()} at ${(current.vol_7d * 100).toFixed(2)}%.`
    : '';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: M.bg,
        color: M.text,
        fontFamily: M.body,
        maxWidth: '428px',
        margin: '0 auto',
      }}
    >
      {/* ——— HEADER ——— */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(11, 17, 32, 0.95)',
          backdropFilter: 'blur(12px)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: M.surface,
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          <ChevronLeft size={20} color={M.textSecondary} />
        </Link>
        <h1
          style={{
            fontFamily: M.display,
            fontSize: '20px',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Market Context
        </h1>
      </header>

      {/* ——— CONTENT ——— */}
      <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <Skeleton />
        ) : error || !data || data.regimes.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ——— A) REGIME TIMELINE ——— */}
            <section style={animDelay(0)}>
              {/* Current regime hero */}
              <div
                style={{
                  background: M.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  border: `1px solid ${M.border}`,
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={18} color={M.accent} />
                    <span style={{ fontSize: '11px', letterSpacing: '0.1em', color: M.accent, fontWeight: 600, textTransform: 'uppercase' as const }}>
                      Current Regime
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} color={M.textMuted} />
                    <span style={{ fontFamily: M.mono, fontSize: '12px', color: M.textMuted }}>
                      {persistence}d
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  {/* Large regime badge */}
                  <div
                    style={{
                      background: regimeDimColor(current!.regime),
                      borderRadius: '12px',
                      padding: '10px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: regimeColor(current!.regime),
                      }}
                    />
                    <span
                      style={{
                        fontFamily: M.display,
                        fontSize: '22px',
                        fontWeight: 600,
                        color: regimeColor(current!.regime),
                      }}
                    >
                      {regimeLabel(current!.regime)}
                    </span>
                  </div>
                  {/* Confidence */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', color: M.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600 }}>
                      Confidence
                    </span>
                    <span style={{ fontFamily: M.mono, fontSize: '18px', fontWeight: 600, color: M.text }}>
                      {Math.round(current!.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: M.textMuted, margin: 0, lineHeight: 1.5 }}>
                  The regime has been consistent across all {persistence} recent observations, suggesting a stable market environment.
                </p>
              </div>

              {/* Timeline */}
              <div
                style={{
                  background: M.surface,
                  borderRadius: '16px',
                  padding: '16px 20px',
                  border: `1px solid ${M.borderSubtle}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Clock size={14} color={M.textMuted} />
                  <span style={{ fontSize: '11px', letterSpacing: '0.08em', color: M.textMuted, fontWeight: 600, textTransform: 'uppercase' as const }}>
                    7-Day History
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {data.regimes.map((r, i) => (
                    <div
                      key={r.timestamp}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 0',
                        borderBottom: i < data.regimes.length - 1 ? `1px solid ${M.borderSubtle}` : 'none',
                      }}
                    >
                      {/* Timeline dot + line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '16px', flexShrink: 0 }}>
                        <div
                          style={{
                            width: i === 0 ? '10px' : '8px',
                            height: i === 0 ? '10px' : '8px',
                            borderRadius: '50%',
                            background: i === 0 ? regimeColor(r.regime) : M.textSubtle,
                            border: i === 0 ? `2px solid ${regimeColor(r.regime)}` : 'none',
                            boxShadow: i === 0 ? `0 0 8px ${regimeColor(r.regime)}40` : 'none',
                          }}
                        />
                      </div>

                      {/* Date */}
                      <span style={{ fontFamily: M.mono, fontSize: '11px', color: M.textMuted, width: '48px', flexShrink: 0 }}>
                        {formatDate(r.timestamp)}
                      </span>

                      {/* Regime badge */}
                      <div
                        style={{
                          background: regimeDimColor(r.regime),
                          borderRadius: '6px',
                          padding: '2px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: regimeColor(r.regime),
                          }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: 500, color: regimeColor(r.regime) }}>
                          {regimeLabel(r.regime)}
                        </span>
                      </div>

                      {/* Regime changed marker */}
                      {r.regime_changed && (
                        <span style={{ fontSize: '9px', color: M.negative, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                          SHIFT
                        </span>
                      )}

                      {/* Price */}
                      <span style={{ fontFamily: M.mono, fontSize: '12px', color: M.textSecondary, marginLeft: 'auto' }}>
                        {formatUsd(r.price_now)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ——— B) PRICE TREND ——— */}
            <section style={animDelay(1)}>
              <div
                style={{
                  background: M.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  border: `1px solid ${M.borderSubtle}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Activity size={14} color={M.textMuted} />
                  <span style={{ fontSize: '11px', letterSpacing: '0.08em', color: M.textMuted, fontWeight: 600, textTransform: 'uppercase' as const }}>
                    Price Trend
                  </span>
                </div>

                {/* BTC */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: M.textSecondary }}>Bitcoin</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontFamily: M.mono, fontSize: '20px', fontWeight: 600, color: M.text }}>
                        {formatUsd(current!.price_now)}
                      </span>
                      <span
                        style={{
                          fontFamily: M.mono,
                          fontSize: '13px',
                          fontWeight: 500,
                          color: btcUp ? M.positive : M.negative,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        {btcUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {formatPct(current!.r_7d)}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: M.textMuted }}>7-day change</span>
                  </div>
                  <Sparkline data={btcSparkData} color={btcUp ? M.positive : M.negative} />
                </div>

                <div style={{ height: '1px', background: M.borderSubtle, margin: '0 0 16px' }} />

                {/* ETH */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: M.textSecondary }}>Ethereum</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontFamily: M.mono, fontSize: '20px', fontWeight: 600, color: M.text }}>
                        {formatUsd(current!.eth_price_now)}
                      </span>
                      <span
                        style={{
                          fontFamily: M.mono,
                          fontSize: '13px',
                          fontWeight: 500,
                          color: ethUp ? M.positive : M.negative,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        {ethUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {formatPct(current!.eth_r_7d)}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: M.textMuted }}>7-day change</span>
                  </div>
                  <Sparkline data={ethSparkData} color={ethUp ? M.positive : M.negative} />
                </div>
              </div>
            </section>

            {/* ——— C) VOLATILITY CONTEXT ——— */}
            <section style={animDelay(2)}>
              <div
                style={{
                  background: M.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  border: `1px solid ${M.borderSubtle}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <BarChart3 size={14} color={M.textMuted} />
                  <span style={{ fontSize: '11px', letterSpacing: '0.08em', color: M.textMuted, fontWeight: 600, textTransform: 'uppercase' as const }}>
                    Volatility Context
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  {/* BTC Vol */}
                  <div
                    style={{
                      flex: 1,
                      background: M.surfaceLight,
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: M.textMuted, fontWeight: 500 }}>BTC 7d Vol</span>
                    <span style={{ fontFamily: M.mono, fontSize: '22px', fontWeight: 600, color: M.text }}>
                      {(current!.vol_7d * 100).toFixed(2)}%
                    </span>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: btcVol!.bg,
                        borderRadius: '20px',
                        padding: '3px 10px',
                        alignSelf: 'flex-start',
                      }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: btcVol!.color }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: btcVol!.color }}>{btcVol!.label}</span>
                    </div>
                  </div>

                  {/* ETH Vol */}
                  <div
                    style={{
                      flex: 1,
                      background: M.surfaceLight,
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: M.textMuted, fontWeight: 500 }}>ETH 7d Vol</span>
                    <span style={{ fontFamily: M.mono, fontSize: '22px', fontWeight: 600, color: M.text }}>
                      {(current!.eth_vol_7d * 100).toFixed(2)}%
                    </span>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: ethVol!.bg,
                        borderRadius: '20px',
                        padding: '3px 10px',
                        alignSelf: 'flex-start',
                      }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ethVol!.color }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: ethVol!.color }}>{ethVol!.label}</span>
                    </div>
                  </div>
                </div>

                {/* Educational explainer */}
                <div
                  style={{
                    background: M.surfaceLight,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <BookOpen size={14} color={M.accent} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ fontSize: '12px', color: M.textSecondary, margin: 0, lineHeight: 1.6 }}>
                    Volatility measures price fluctuation intensity over 7 days. <strong style={{ color: M.positive }}>Low</strong> ({'<'}1.5%) suggests calm conditions, <strong style={{ color: M.accent }}>Moderate</strong> (1.5–2.5%) is typical, and <strong style={{ color: M.negative }}>Elevated</strong> ({'>'}2.5%) may indicate heightened uncertainty.
                  </p>
                </div>
              </div>
            </section>

            {/* ——— D) NARRATIVE ——— */}
            <section style={animDelay(3)}>
              <div
                style={{
                  background: M.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  border: `1px solid ${M.border}`,
                  borderLeft: `3px solid ${M.accent}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <BookOpen size={14} color={M.accent} />
                  <span style={{ fontSize: '11px', letterSpacing: '0.08em', color: M.accent, fontWeight: 600, textTransform: 'uppercase' as const }}>
                    How Did We Get Here
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: M.textSecondary, margin: 0, lineHeight: 1.7 }}>
                  {narrative}
                </p>
                <p style={{ fontSize: '11px', color: M.textMuted, margin: '12px 0 0', fontStyle: 'italic' }}>
                  This summary is auto-generated from observable market data. It describes conditions, not predictions.
                </p>
              </div>
            </section>

            {/* ——— GENERATED TIMESTAMP ——— */}
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: '10px', color: M.textSubtle, fontFamily: M.mono }}>
                Updated {new Date(data.generated_at).toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}