// v2.1.0 · ca-story99 · Sprint 19
// S99: Volume/volatility label cleanup — relabel + real volume display 
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, Activity } from 'lucide-react'
import { M } from '@/lib/meridian'
import ProgressiveDisclosure, { DisclosureGroup,} from '@/components/education/ProgressiveDisclosure'
import GradientBar from '@/components/shared/GradientBar'
import RegimeIcon from '@/components/shared/RegimeIcon'
import { card, regimeIconBg, regimeNarrative, anim } from '@/lib/ui-helpers'
import TimelineStrip from '@/components/regime/TimelineStrip'
import AggSection from '@/components/regime/AggSection'
import { compressToRuns, buildAgg, getRegimeConfig } from '@/lib/regime-utils'
import type { RegimeRow as UtilRegimeRow } from '@/lib/regime-utils'
import { useTier } from "@/hooks/useTier"
import { ProGate } from "@/components/shared/ProGate"

// ── Types ─────────────────────────────────────

interface RegimeRow {
  timestamp: string
  regime: string
  previous_regime: string | null
  regime_changed: boolean
  confidence: number
  price_now: number
  r_1d: number
  r_7d: number
  vol_7d: number
  eth_price_now: number
  eth_r_7d: number
  eth_vol_7d: number
}

interface PriceRow {
  timestamp: string
  btc_usd: number
  eth_usd: number
}

interface DurationPattern {
  regime: string
  instance_count: number
  avg_duration: number
  min_duration: number
  max_duration: number
  current_run_days: number | null
}

interface TransitionPair {
  from: string
  to: string
  count: number
  last_seen: string
}

interface MarketContextData {
  regimes: RegimeRow[]
  prices: PriceRow[]
  duration_patterns: DurationPattern[]
  transitions: TransitionPair[]
  transition_count: number
  row_count: number
  days_requested: number
  generated_at: string
}

interface ConfidenceTrend {
  direction: 'rising' | 'declining' | 'stable'
  streak: number
}

// ── Shared Helpers ────────────────────────────


// ── Indicator Card (v2 — clean label + inline info) ──

function Indicator({
  label,
  value,
  desc,
  pct,
  gradient,
  infoId,
  infoText,
}: {
  label: string
  value: string
  desc: string
  pct: number
  gradient: string
  infoId: string
  infoText: string
}) {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div style={{ ...card(), marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: M.text, whiteSpace: 'nowrap' }}>{label}</span>
          <button
            onClick={() => setShowInfo(!showInfo)}
            aria-label={`Info about ${label}`}
            style={{
              width: 18, height: 18, borderRadius: '50%',
              background: showInfo ? M.accentDim : 'rgba(139,117,101,0.1)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
              color: showInfo ? M.accent : M.textMuted,
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            i
          </button>
        </div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 600, color: M.text, flexShrink: 0, marginLeft: 12 }}>
          {value}
        </span>
      </div>
      {showInfo && (
        <div style={{
          marginBottom: 12, padding: '10px 12px', borderRadius: 12,
          background: M.accentGlow, border: `1px solid ${M.borderAccent}`,
        }}>
          <p style={{ fontSize: 11, color: M.textSecondary, lineHeight: 1.6, margin: 0 }}>{infoText}</p>
        </div>
      )}
      <GradientBar pct={pct} gradient={gradient} h={8} />
      <p style={{ fontSize: 12, color: M.textSecondary, margin: '8px 0 0' }}>{desc}</p>
    </div>
  )
}

// ── Regime helpers ────────────────────────────

function computePersistence(regimes: RegimeRow[]): number {
  if (regimes.length === 0) return 0
  const current = regimes[0].regime
  let count = 0
  for (const r of regimes) {
    if (r.regime === current) count++
    else break
  }
  return count
}

function volumeLabel(vol: number): string {
  if (vol < 0.015) return 'Low'
  if (vol <= 0.025) return 'Moderate'
  return 'High'
}

// ── Skeleton ──────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-3xl animate-pulse"
          style={{ background: M.surfaceLight, height: i === 1 ? 280 : 100 }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════

export default function MarketPulsePage() {
  const [data, setData] = useState<MarketContextData | null>(null)
  const [metrics, setMetrics] = useState<{
    fearGreed: number
    fearGreedLabel: string
    btcDominance: number
    altSeason: number
    totalVolume: number | null
  } | null>(null)
  const [regimeExplainer, setRegimeExplainer] = useState<{ summary: string; slug: string } | null>(null)
  const [confidenceTrend, setConfidenceTrend] = useState<ConfidenceTrend | null>(null)
  const [period, setPeriod] = useState<7 | 30 | 90>(7)
  const { isPro } = useTier()
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [contextRes, marketRes] = await Promise.all([
          fetch(`/api/market-context?days=${period}`),
          fetch('/api/market'),
        ])
        if (contextRes.ok) {
          const json: MarketContextData = await contextRes.json()
          setData(json)
        // Fetch regime-specific explainer from glossary
          if (json.regimes?.[0]?.regime) {
            const regimeId = json.regimes[0].regime.toLowerCase().replace(/\s+/g, '')
            const gRes = await fetch(`/api/glossary?regime=${regimeId}`)
            if (gRes.ok) {
              const gData = await gRes.json()
              const entry = Array.isArray(gData) ? gData[0] : gData
              if (entry) setRegimeExplainer({ summary: entry.summary, slug: entry.slug })
            }
          }
        }
        if (marketRes.ok) {
          const marketJson = await marketRes.json()
          if (marketJson.metrics) {
           setMetrics({
              fearGreed: marketJson.metrics.fearGreed ?? 50,
              fearGreedLabel: marketJson.metrics.fearGreedLabel ?? 'Neutral',
              btcDominance: marketJson.metrics.btcDominance ?? 50,
              altSeason: marketJson.metrics.altSeason ?? 50,
              totalVolume: marketJson.metrics.totalVolume ?? null,
            })
          }
          if (marketJson.confidenceTrend) {
            setConfidenceTrend(marketJson.confidenceTrend)
          }
        }
        
      } catch (err) {
        console.error('Market pulse fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  // ── Regime timeline data (S82) ──
  const regimeRows: UtilRegimeRow[] = useMemo(() => {
    if (!data?.regimes?.length) return []
    return data.regimes.map(r => ({
      timestamp: r.timestamp,
      regime: r.regime,
      confidence: r.confidence,
      price_now: r.price_now,
    }))
  }, [data])

  const runs = useMemo(() => compressToRuns(regimeRows), [regimeRows])
  const agg = useMemo(() => buildAgg(runs, regimeRows), [runs, regimeRows])

  const current = data?.regimes?.[0] ?? null
  const persistence = data ? computePersistence(data.regimes) : 0
  const ethAligned = current ? (current.r_7d >= 0) === (current.eth_r_7d >= 0) : false
  const volLabel = current ? volumeLabel(current.vol_7d) : 'Moderate'

  // Sentiment values from /api/market or fallback
  const fearGreed = metrics?.fearGreed ?? 50
  const fearGreedLabel = metrics?.fearGreedLabel ?? 'Neutral'
  const btcDom = metrics?.btcDominance ?? 50
  const altSeason = metrics?.altSeason ?? 50

  // Fear & Greed description
  const fgDesc =
    fearGreed >= 75 ? 'Extreme greed — caution warranted'
    : fearGreed >= 50 ? `${fearGreedLabel} — cautious optimism`
    : fearGreed >= 25 ? `${fearGreedLabel} — uncertainty in the market`
    : 'Extreme fear — risk-off environment'

  // BTC Dominance description
  const domDesc =
    btcDom >= 55 ? 'Rising — capital consolidating into Bitcoin'
    : btcDom >= 45 ? 'Stable — balanced between BTC and alts'
    : 'Falling — capital rotating into altcoins'

  // ALT Season description
  const altDesc =
    altSeason >= 60 ? 'Alt season — altcoins outperforming BTC'
    : altSeason >= 40 ? 'Neutral — mixed performance'
    : 'BTC-led — altcoins underperforming'

  // Signal coherence narrative
  const coherenceNarrative = current
    ? `${getRegimeConfig(current.regime).l} regime with ${Math.round(current.confidence * 100)}% confidence${
        !ethAligned ? ', but ETH and BTC are diverging' : ''
      }. ${fearGreed >= 50 ? 'Greed is present' : 'Fear dominates'} but ${
        altSeason < 40 ? 'altcoins are underperforming' : 'altcoins are gaining ground'
      } — ${volLabel === 'Low' ? 'volatility is low, suggesting calm conditions' : volLabel === 'Moderate' ? 'volatility is neutral' : 'volatility is elevated, suggesting larger moves'}. This is a ${fearGreed >= 60 && ethAligned ? 'moderately confident' : 'wait-and-watch'} environment.`
    : 'Loading market data...'

  return (
    <DisclosureGroup>
      <div style={{ padding: '24px 20px 0' }}>
        {/* ── Page Header ── */}
        <div style={{ marginBottom: 24, ...anim(mounted, 0) }}>
          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 24,
              fontWeight: 500,
              color: M.text,
              margin: '0 0 4px',
            }}
          >
            Market Pulse
          </h1>
          <p style={{ fontSize: 14, color: M.textSecondary, margin: 0 }}>
            Current environment and signals
          </p>
        </div>

        {loading ? (
          <Skeleton />
        ) : !current ? (
          <div style={{ ...card(), textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 14, color: M.textSecondary, margin: '0 0 4px' }}>
              No market data available
            </p>
            <p style={{ fontSize: 12, color: M.textMuted, margin: '0 0 14px' }}>
              Check back when market data starts flowing
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: M.surface,
                border: `1px solid ${M.border}`,
                borderRadius: 12,
                padding: '8px 16px',
                fontSize: 12,
                color: M.text,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* ── Regime Card (teal variant) ── */}
            <div
              style={{
                ...card({
                  background: 'linear-gradient(135deg, rgba(42,157,143,0.1), rgba(42,157,143,0.05))',
                  border: `1px solid ${M.borderPositive}`,
                }),
                marginBottom: 16,
                ...anim(mounted, 1),
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 8 }}>
                  <ProgressiveDisclosure
                      id="regime"
                      summary={
                        <span style={{ fontSize: 12, color: M.textMuted }}>Market Regime</span>
                      }
                      context={regimeExplainer?.summary ?? 'The market is categorized as Bull (upward), Bear (downward), Range (sideways), or Volatile (unstable).'}
                      learnMoreHref={regimeExplainer ? `/profile/learn/glossary#${regimeExplainer.slug}` : undefined}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 30,
                      fontWeight: 600,
                      color: M.text,
                      marginBottom: 4,
                    }}
                  >
                    {getRegimeConfig(current.regime).l}
                  </div>
                  <div style={{ fontSize: 14, color: M.textSecondary }}>
                    {persistence} days in state
                  </div>
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: regimeIconBg(current.regime),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(42,157,143,0.3)',
                  }}
                >
                  <RegimeIcon regime={current.regime} />
                </div>
              </div>

              <p
                style={{
                  fontSize: 14,
                  color: M.textSecondary,
                  lineHeight: 1.6,
                  margin: '0 0 16px',
                }}
              >
                {regimeNarrative(current.regime)}
              </p>

              {/* Confidence sub-card */}
              <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: 20, padding: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: M.textMuted }}>Confidence in classification</span>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 22,
                      fontWeight: 600,
                      color: M.text,
                    }}
                  >
                    {Math.round(current.confidence * 100)}%
                  </span>
                </div>
                <GradientBar
                  pct={current.confidence * 100}
                  gradient="linear-gradient(90deg, #2A9D8F, rgba(42,157,143,0.8))"
                />
                {confidenceTrend && confidenceTrend.streak > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '8px 0 0' }}>
                    <span style={{ fontSize: 11, color: confidenceTrend.direction === 'rising' ? M.positive : confidenceTrend.direction === 'declining' ? M.negative : M.textMuted }}>
                      {confidenceTrend.direction === 'rising' ? '↑' : confidenceTrend.direction === 'declining' ? '↓' : '→'}
                      {' '}
                      {confidenceTrend.direction === 'stable'
                        ? 'Stable'
                        : `${confidenceTrend.direction.charAt(0).toUpperCase() + confidenceTrend.direction.slice(1)} for ${confidenceTrend.streak} days`}
                    </span>
                  </div>
                )}
                <p style={{ fontSize: 10, color: M.textSecondary, lineHeight: 1.6, margin: '8px 0 0' }}>
                  {current.confidence >= 0.7
                    ? 'Strong signal. BTC and ETH show aligned 7-day trends with moderate volatility. A reading above 70% indicates the pattern is clear and sustained.'
                    : current.confidence >= 0.5
                    ? 'Moderate signal. Indicators are leaning in one direction but not yet fully committed.'
                    : 'Weak signal. Mixed indicators suggest the current classification may shift soon.'}
                </p>
              </div>
            </div>

            {/* ── ETH Confirmation Card ── */}
            <div
              style={{
                ...card({ background: 'rgba(255,255,255,0.5)' }),
                marginBottom: 16,
                ...anim(mounted, 2),
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: M.textMuted, marginBottom: 4 }}>
                    ETH confirmation
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: M.text, marginBottom: 4 }}>
                    {ethAligned ? 'Aligned with BTC' : 'Diverging from BTC'}
                  </div>
                  <p style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.5, margin: 0 }}>
                    {ethAligned
                      ? 'ETH shows matching 7-day direction, reinforcing the reading'
                      : 'ETH and BTC show different 7-day trends, weakening confidence'}
                  </p>
                </div>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: ethAligned ? M.positiveDim : M.negativeDim,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginLeft: 16,
                  }}
                >
                  <Check
                    size={20}
                    color={ethAligned ? M.positive : M.negative}
                    strokeWidth={2.5}
                  />
                </div>
              </div>
            </div>

            {/* ── BTC + ETH Price Row (design v2.1) ── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, ...anim(mounted, 2.2) }}>
              {([
                { symbol: 'BTC', name: 'Bitcoin', price: current.price_now, change: current.r_1d * 100, bg: 'linear-gradient(135deg, #F7931A, #FF9D2E)', shadow: 'rgba(247,147,26,0.3)' },
                { symbol: 'ETH', name: 'Ethereum', price: current.eth_price_now, change: current.eth_r_7d * 100, bg: 'linear-gradient(135deg, #627EEA, #8299EF)', shadow: 'rgba(98,126,234,0.3)' },
              ] as const).map(coin => {
                const isPos = coin.change >= 0
                return (
                  <div key={coin.symbol} style={{ ...card({ padding: '14px' }), flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 10,
                        background: coin.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 2px 8px ${coin.shadow}`, flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'white' }}>{coin.symbol.charAt(0)}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: M.text, fontFamily: "'DM Mono', monospace" }}>{coin.symbol}</div>
                        <div style={{ fontSize: 10, color: M.textMuted }}>{coin.name}</div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: 18, fontWeight: 700, color: M.text,
                      fontFamily: "'DM Sans', sans-serif",
                      fontFeatureSettings: "'tnum' 1, 'lnum' 1",
                      marginBottom: 6, lineHeight: 1,
                    }}>
                      ${coin.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      background: isPos ? M.positiveDim : M.negativeDim,
                      borderRadius: 8, padding: '3px 8px',
                    }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: isPos ? M.positive : M.negative,
                        fontFamily: "'DM Sans', sans-serif",
                        fontFeatureSettings: "'tnum' 1, 'lnum' 1",
                      }}>
                        {isPos ? '+' : ''}{coin.change.toFixed(2)}%
                      </span>
                      <span style={{ fontSize: 9, color: isPos ? M.positive : M.negative, opacity: 0.7 }}>24h</span>
                    </div>
                  </div>
                )
              })}
            </div>

              {/* ── Regime History (S82) ── */}
               <div style={{ marginBottom: 16, ...anim(mounted, 2.5) }}>
              {/* Period tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {([7, 30, 90] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setPeriod(d)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 16,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                      background: period === d ? M.accentGradient : M.surface,
                      backdropFilter: period === d ? 'none' : M.surfaceBlur,
                      WebkitBackdropFilter: period === d ? 'none' : M.surfaceBlur,
                      color: period === d ? 'white' : M.textMuted,
                      boxShadow: period === d ? '0 2px 8px rgba(231,111,81,0.2)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {d}d
                  </button>
                ))}
              </div>

              {/* Collapsible regime history header (v3.2) */}
              {(() => {
                const curRun = runs.length ? runs[runs.length - 1] : null
                const curRC = curRun ? getRegimeConfig(curRun.regime) : null
                return (
                  <>
                    <button
                      onClick={() => setHistoryExpanded(!historyExpanded)}
                      style={{
                        ...card({ padding: '14px' }),
                        width: '100%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: historyExpanded ? 16 : 0,
                        border: historyExpanded
                          ? `1px solid ${M.borderPositive}`
                          : `1px solid ${M.border}`,
                        background: historyExpanded
                          ? 'linear-gradient(135deg, rgba(42,157,143,0.06), rgba(42,157,143,0.02))'
                          : M.surface,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: curRC?.bg || M.accentGradient,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, color: 'white', fontWeight: 700, flexShrink: 0,
                        }}>
                          {curRC?.icon || '—'}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>
                            {curRun ? `${curRC!.l} for ${curRun.days} days` : 'No history'}
                          </div>
                          <div style={{ fontSize: 11, color: M.textMuted }}>
                            {agg.tc} shift{agg.tc !== 1 ? 's' : ''} · {agg.ac}% avg conf
                            {agg.dom && agg.bd.length > 1 && (
                              <span> · {agg.dom.pct}% {getRegimeConfig(agg.dom.regime).l}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        display: 'inline-block',
                        transform: historyExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                        fontSize: 16, color: M.textMuted,
                      }}>
                        ▾
                      </span>
                    </button>

                    {/* Expanded content */}
                    <div style={{
                      maxHeight: historyExpanded ? 900 : 0,
                      opacity: historyExpanded ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 0.35s ease, opacity 0.25s ease',
                    }}>

                      <ProGate isPro={isPro || period === 7} label={`${period}-day history is Pro`}>

                      {/* Sparse data notice */}
                      {data && data.row_count < period && data.row_count > 0 && (
                        <div style={{
                          ...card({ padding: '12px' }),
                          marginBottom: 12,
                          background: 'rgba(244,162,97,0.05)',
                          border: `1px solid ${M.borderAccent}`,
                        }}>
                          <p style={{ fontSize: 11, color: M.textSecondary, margin: 0, lineHeight: 1.5 }}>
                            Meridian has {data.row_count} days of history. This view fills in automatically as data accumulates.
                          </p>
                        </div>
                      )}

                      {/* Timeline strip + aggregation */}
                      {runs.length > 0 ? (
                        <>
                          <TimelineStrip runs={runs} totalDays={agg.td} period={period} />
                          <AggSection agg={agg} />
                        </>
                      ) : (
                        <div style={{ ...card(), textAlign: 'center', padding: '32px 20px' }}>
                          <p style={{ fontSize: 14, color: M.textSecondary, margin: '0 0 4px' }}>No data for this period</p>
                          <p style={{ fontSize: 12, color: M.textMuted, margin: 0 }}>Try a shorter timeframe</p>
                        </div>
                      )}

                      {/* Educational footer */}
                      <div style={{
                        marginTop: 16,
                        padding: 12,
                        background: 'rgba(244,162,97,0.05)',
                        borderRadius: 12,
                      }}>
                        <p style={{ fontSize: 11, color: M.textSecondary, lineHeight: 1.6, margin: 0 }}>
                          Regime classification suggests the prevailing market character. Confidence reflects
                          how clearly the pattern fits — higher values indicate stronger agreement across indicators.
                          This is an analytical lens, not a trading signal.
                        </p>
                      </div>
                      </ProGate>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* ── Sentiment Indicators ── */}
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: M.text,
                margin: '0 0 12px',
                ...anim(mounted, 3),
              }}
            >
              Sentiment indicators
            </h2>

            <div style={anim(mounted,3)}>
              <Indicator
                label="Fear & Greed Index"
                value={String(fearGreed)}
                desc={fgDesc}
                pct={fearGreed}
                gradient={M.accentGradient}
                infoId="fear"
                infoText="Composite score 0–100. Low = fear (risk-off). High = greed (risk-on). 50-75 typically indicates moderate optimism without euphoria."
              />
              <Indicator
                label="Bitcoin Dominance"
                value={`${btcDom.toFixed(1)}%`}
                desc={domDesc}
                pct={btcDom}
                gradient="linear-gradient(90deg, #F7931A, #F79A1F)"
                infoId="dom"
                infoText="BTC's share of total crypto market cap. Rising = capital consolidating into Bitcoin. Falling = rotating into alts."
              />
              <Indicator
                label="ALT Season Index"
                value={String(altSeason)}
                desc={altDesc}
                pct={altSeason}
                gradient="linear-gradient(90deg, #14F195, #9945FF)"
                infoId="alt"
                infoText="Measures whether altcoins outperform Bitcoin. High score = alts running. Low score = BTC leading."
              />
            </div>

            {/* ── Volatility── */}
            <div style={{ ...card(), marginBottom: 16, ...anim(mounted, 4) }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: M.text }}>Volatility</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 600, color: M.text }}>
                  {volLabel}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 32,
                    background: volLabel === 'Low' ? 'linear-gradient(90deg, #2A9D8F, rgba(42,157,143,0.8))' : '#E8DED6',
                    borderRadius: 4,
                    opacity: volLabel === 'Low' ? 1 : 0.3,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 32,
                    background: volLabel === 'Moderate' ? 'linear-gradient(90deg, #2A9D8F, rgba(42,157,143,0.8))' : '#E8DED6',
                    borderRadius: 4,
                    opacity: volLabel === 'Moderate' ? 1 : 0.3,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 32,
                    background: volLabel === 'High' ? 'linear-gradient(90deg, #E76F51, rgba(231,111,81,0.8))' : '#E8DED6',
                    borderRadius: 4,
                    opacity: volLabel === 'High' ? 1 : 0.3,
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: M.textSecondary, margin: 0 }}>
                {volLabel === 'Low' ? 'Below average activity — suggests indecision'
                  : volLabel === 'Moderate' ? 'Average activity — neither confirming nor contradicting'
                  : 'Above average activity — conviction in the current direction'}
              </p>
            </div>

            {/* ── Market Volume ── */}
            {metrics?.totalVolume != null && (
              <div style={{ ...card(), marginBottom: 16, ...anim(mounted, 4.5) }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <ProgressiveDisclosure
                    id="mkt-vol"
                    summary={
                      <span style={{ fontSize: 14, fontWeight: 600, color: M.text }}>Market Volume</span>
                    }
                    context="Total 24-hour trading volume across all crypto markets. Higher volume indicates more market participation and conviction in price moves."
                  />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 600, color: M.text }}>
                    ${(metrics.totalVolume / 1e9).toFixed(1)}B
                  </span>
                </div>
              </div>
            )}

            {/* ── Signal Coherence ── */}
            <div
              style={{
                ...card({
                  background: 'linear-gradient(135deg, rgba(244,162,97,0.1), rgba(231,111,81,0.1))',
                  border: `1px solid ${M.borderAccent}`,
                }),
                ...anim(mounted, 5),
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(244,162,97,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Activity size={16} color={M.accent} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: M.text, marginBottom: 6 }}>
                    {ethAligned && fearGreed >= 50 && altSeason >= 40
                      ? 'Strong signal coherence'
                      : 'Mixed signal coherence'}
                  </div>
                  <p style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.6, margin: 0 }}>
                    {coherenceNarrative}
                  </p>
                </div>
              </div>
            </div>

            {/* Transitions removed — now inside regime history component */}

            {/* ── Timestamp ── */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 10,
                color: M.textSubtle,
                fontFamily: "'DM Mono', monospace",
                padding: '16px 0 8px',
                ...anim(mounted, 6),
              }}
            >
              Updated {data?.generated_at ? new Date(data.generated_at).toLocaleString() : '—'}
            </div>
          </>
        )}
      </div>
    </DisclosureGroup>
  )
}
