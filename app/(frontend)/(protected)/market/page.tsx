// ━━━ Market Pulse Screen ━━━
// v1.7.0 · ca-story57 · 2026-02-25
// Refactored: InfoBtn/InfoPanel replaced with ProgressiveDisclosure component
// All 5 disclosure instances migrated: regime, fear, dom, alt, vol
// Visual output unchanged (regression-free)
// Changelog (from v1.2.0):
//  - Removed inline InfoBtn, InfoPanel components
//  - Added DisclosureGroup + ProgressiveDisclosure from components/education/
//  - Removed local [info, setInfo] state (now managed by DisclosureGroup context)
//  - Indicator component simplified (no more info/setInfo prop threading)
'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Check, Activity } from 'lucide-react'
import { M } from '@/lib/meridian'
import ProgressiveDisclosure, {
  DisclosureGroup,
} from '@/components/education/ProgressiveDisclosure'

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

const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: M.surface,
  backdropFilter: M.surfaceBlur,
  WebkitBackdropFilter: M.surfaceBlur,
  borderRadius: '24px',
  padding: '20px',
  border: `1px solid ${M.border}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  ...extra,
})

function GradientBar({
  pct,
  gradient = M.accentGradient,
  h = 8,
}: {
  pct: number
  gradient?: string
  h?: number
}) {
  return (
    <div style={{ height: h, borderRadius: h, background: '#E8DED6', overflow: 'hidden', width: '100%' }}>
      <div
        style={{
          height: '100%',
          borderRadius: h,
          background: gradient,
          width: `${Math.min(100, Math.max(0, pct))}%`,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  )
}

// ── Indicator Card (simplified — no info/setInfo threading) ──

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
  return (
    <div style={{ ...card(), marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <ProgressiveDisclosure
          id={infoId}
          summary={
            <span style={{ fontSize: 14, fontWeight: 600, color: M.text }}>{label}</span>
          }
          context={infoText}
        />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 600, color: M.text }}>
          {value}
        </span>
      </div>
      <GradientBar pct={pct} gradient={gradient} h={8} />
      <p style={{ fontSize: 12, color: M.textSecondary, margin: '8px 0 0' }}>{desc}</p>
    </div>
  )
}

// ── Regime helpers ────────────────────────────

function RegimeIcon({ regime }: { regime: string }) {
  const r = regime.toLowerCase()
  if (r.includes('bull')) return <TrendingUp size={28} color="white" strokeWidth={2.5} />
  if (r.includes('bear')) return <TrendingDown size={28} color="white" strokeWidth={2.5} />
  return <Minus size={28} color="white" strokeWidth={2.5} />
}

function regimeIconBg(regime: string): string {
  const r = regime.toLowerCase()
  if (r.includes('bull')) return 'linear-gradient(135deg, #2A9D8F, rgba(42,157,143,0.8))'
  if (r.includes('bear')) return 'linear-gradient(135deg, #E76F51, rgba(231,111,81,0.8))'
  return 'linear-gradient(135deg, #F4A261, rgba(244,162,97,0.8))'
}

function regimeNarrative(regime: string): string {
  const r = regime.toLowerCase()
  if (r.includes('bull'))
    return 'Upward momentum within a defined range. Breakout potential exists, though volatility remains contained. Not directional enough to signal a clear trend shift.'
  if (r.includes('bear'))
    return 'Downward pressure with elevated volatility. Capital is consolidating into safer positions. Not yet at capitulation levels.'
  return 'Market moving sideways with no clear directional bias. Consolidation phase with moderate activity.'
}

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
  } | null>(null)
  const [regimeExplainer, setRegimeExplainer] = useState<{ summary: string; slug: string } | null>(null)
  const [confidenceTrend, setConfidenceTrend] = useState<ConfidenceTrend | null>(null)
  const [period, setPeriod] = useState<7 | 30 | 90>(7)
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

  const anim = (i: number): React.CSSProperties => ({
    opacity: mounted && !loading ? 1 : 0,
    transform: mounted && !loading ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
  })

  const current = data?.regimes?.[0] ?? null
  const persistence = data ? computePersistence(data.regimes) : 0
  const ethAligned = current ? (current.r_7d >= 0) === (current.eth_r_7d >= 0) : false
  const vol = current ? volumeLabel(current.vol_7d) : 'Moderate'

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
    ? `${current.regime.charAt(0).toUpperCase() + current.regime.slice(1)} regime with ${Math.round(current.confidence * 100)}% confidence${
        !ethAligned ? ', but ETH and BTC are diverging' : ''
      }. ${fearGreed >= 50 ? 'Greed is present' : 'Fear dominates'} but ${
        altSeason < 40 ? 'altcoins are underperforming' : 'altcoins are gaining ground'
      } — ${vol === 'Low' ? 'volume is low, suggesting indecision' : vol === 'Moderate' ? 'volume is neutral' : 'volume is elevated, suggesting conviction'}. This is a ${fearGreed >= 60 && ethAligned ? 'moderately confident' : 'wait-and-watch'} environment.`
    : 'Loading market data...'

  return (
    <DisclosureGroup>
      <div style={{ padding: '24px 20px 0' }}>
        {/* ── Page Header ── */}
        <div style={{ marginBottom: 24, ...anim(0) }}>
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
            <p style={{ fontSize: 12, color: M.textMuted, margin: 0 }}>
              Check back when market data starts flowing
            </p>
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
                ...anim(1),
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
                      learnMoreHref={regimeExplainer ? `/settings/learn/glossary#${regimeExplainer.slug}` : undefined}
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
                    {current.regime.charAt(0).toUpperCase() + current.regime.slice(1)}
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
                {confidenceTrend && confidenceTrend.streak > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    margin: '8px 0 4px',
                  }}>
                    <span style={{ fontSize: 14 }}>
                      {confidenceTrend.direction === 'rising' ? '↑'
                        : confidenceTrend.direction === 'declining' ? '↓' : '→'}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontFamily: "'DM Sans', sans-serif",
                      color: confidenceTrend.direction === 'rising' ? M.positive
                        : confidenceTrend.direction === 'declining' ? M.negative
                        : M.textMuted,
                    }}>
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
                ...anim(2),
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

            {/* ── Regime History (S53 + S54) ── */}
            <div style={{ marginBottom: 16, ...anim(2.5) }}>
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
                      color: period === d ? 'white' : M.textMuted,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {d}d
                  </button>
                ))}
              </div>

              {/* Sparse data notice */}
              {data && data.row_count < period && data.row_count > 0 && (
                <div style={{
                  ...card({ padding: 12, marginBottom: 12 }),
                  background: 'rgba(244,162,97,0.05)',
                  border: `1px solid ${M.borderAccent}`,
                }}>
                  <p style={{ fontSize: 11, color: M.textSecondary, margin: 0, lineHeight: 1.5 }}>
                    Meridian has {data.row_count} days of history. This view fills in automatically as data accumulates.
                  </p>
                </div>
              )}

              {/* Duration pattern summary (S54) */}
              {data?.duration_patterns && data.duration_patterns.length >= 2 && (
                <div style={{ ...card({ padding: 14, marginBottom: 12 }) }}>
                  <p style={{ fontSize: 12, color: M.textSecondary, margin: 0 }}>
                    Average regime duration:{' '}
                    <span style={{ fontWeight: 600, color: M.text, fontFamily: "'DM Mono', monospace" }}>
                      {Math.round(data.duration_patterns.reduce((s, p) => s + p.avg_duration, 0) / data.duration_patterns.length)} days
                    </span>
                    {' '}across {data.duration_patterns.reduce((s, p) => s + p.instance_count, 0)} instances
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data?.regimes?.map((r, i) => {
                  // Duration badge: count consecutive same-regime from this point
                  let streak = 1
                  for (let j = i + 1; j < data.regimes.length; j++) {
                    if (data.regimes[j].regime === r.regime) streak++
                    else break
                  }
                  const dayLabel = i === 0 ? `Day ${streak}` : null

                  // Find duration pattern for this regime
                  const pattern = data.duration_patterns?.find(
                    p => p.regime.toLowerCase() === r.regime.toLowerCase()
                  )

                  const isFirst = i === 0

                  return (
                    <div
                      key={r.timestamp}
                      style={{
                        ...card({ padding: 14 }),
                        background: isFirst ? 'linear-gradient(135deg, rgba(42,157,143,0.08), rgba(42,157,143,0.03))' : M.surface,
                        border: isFirst ? `1px solid ${M.borderPositive}` : `1px solid ${M.border}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: r.regime.toLowerCase().includes('bull') ? M.positive
                              : r.regime.toLowerCase().includes('bear') ? M.negative
                              : M.accent,
                          }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: M.text }}>
                            {r.regime.charAt(0).toUpperCase() + r.regime.slice(1)}
                          </span>
                          {dayLabel && (
                            <span style={{
                              fontSize: 10, fontWeight: 600, color: M.positive,
                              background: M.positiveDim, padding: '2px 8px', borderRadius: 8,
                            }}>
                              {dayLabel}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: M.textMuted, fontFamily: "'DM Mono', monospace" }}>
                          {new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div style={{ marginBottom: 4 }}>
                        <GradientBar
                          pct={r.confidence * 100}
                          gradient="linear-gradient(90deg, #2A9D8F, rgba(42,157,143,0.8))"
                          h={4}
                        />
                      </div>

                      {/* S54: Duration context for first entry only */}
                      {isFirst && pattern && (
                        <p style={{ fontSize: 11, color: M.textMuted, margin: '6px 0 0', lineHeight: 1.4 }}>
                          {pattern.instance_count >= 5
                            ? `${r.regime.charAt(0).toUpperCase() + r.regime.slice(1)} regimes typically last ${Math.round(pattern.avg_duration)}–${pattern.max_duration} days. This is day ${streak}.`
                            : pattern.instance_count > 1
                            ? `Not enough history to show duration patterns yet. ${pattern.instance_count} instances recorded.`
                            : 'First recorded instance of this regime. Patterns will emerge over time.'}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Empty state */}
              {data?.regimes?.length === 0 && (
                <div style={{ ...card(), textAlign: 'center', padding: '32px 20px' }}>
                  <p style={{ fontSize: 14, color: M.textSecondary, margin: '0 0 4px' }}>No data for this period</p>
                  <p style={{ fontSize: 12, color: M.textMuted, margin: 0 }}>Try a shorter timeframe</p>
                </div>
              )}
            </div>

            {/* ── Sentiment Indicators ── */}
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: M.text,
                margin: '0 0 12px',
                ...anim(3),
              }}
            >
              Sentiment indicators
            </h2>

            <div style={anim(3)}>
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

            {/* ── Volume Profile ── */}
            <div style={{ ...card(), marginBottom: 16, ...anim(4) }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <ProgressiveDisclosure
                  id="vol"
                  summary={
                    <span style={{ fontSize: 14, fontWeight: 600, color: M.text }}>Volume Profile</span>
                  }
                  context="Market activity level. High volume in bull = reinforcement. High volume in bear = panic/capitulation. Low volume in range = indecision."
                />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 600, color: M.text }}>
                  {vol}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 32,
                    background: vol === 'Low' ? 'linear-gradient(90deg, #2A9D8F, rgba(42,157,143,0.8))' : '#E8DED6',
                    borderRadius: 4,
                    opacity: vol === 'Low' ? 1 : 0.3,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 32,
                    background: vol === 'Moderate' ? 'linear-gradient(90deg, #2A9D8F, rgba(42,157,143,0.8))' : '#E8DED6',
                    borderRadius: 4,
                    opacity: vol === 'Moderate' ? 1 : 0.3,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 32,
                    background: vol === 'High' ? 'linear-gradient(90deg, #E76F51, rgba(231,111,81,0.8))' : '#E8DED6',
                    borderRadius: 4,
                    opacity: vol === 'High' ? 1 : 0.3,
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: M.textSecondary, margin: 0 }}>
                {vol === 'Low' ? 'Below average activity — suggests indecision'
                  : vol === 'Moderate' ? 'Average activity — neither confirming nor contradicting'
                  : 'Above average activity — conviction in the current direction'}
              </p>
            </div>

            {/* ── Signal Coherence ── */}
            <div
              style={{
                ...card({
                  background: 'linear-gradient(135deg, rgba(244,162,97,0.1), rgba(231,111,81,0.1))',
                  border: `1px solid ${M.borderAccent}`,
                }),
                ...anim(5),
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

            {/* ── Regime Transitions (S56) ── */}
            <div style={{ marginTop: 16, ...anim(6) }}>
              <ProgressiveDisclosure
                id="transitions"
                summary={
                  <h2 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 18, fontWeight: 600, color: M.text, margin: 0,
                  }}>
                    Regime transitions
                  </h2>
                }
                context="Transitions show how market conditions typically shift. Tracking which regimes follow each other helps you anticipate what may come next."
              />

              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data && data.transition_count > 0 ? (
                  data.transitions.map((t, i) => {
                    const LABELS: Record<string, string> = {
                      bull: 'Bull', bear: 'Bear', range: 'Range',
                      volatile: 'Volatile', 'bull range': 'Bull Range',
                    }
                    const FRAMING: Record<string, string> = {
                      'range→bull': 'Range-to-bull transitions often follow sustained volume increases and improving sentiment.',
                      'range→bear': 'A shift from range to bear typically reflects deteriorating momentum across major assets.',
                      'bull→range': 'Bull markets often cool into range-bound conditions before the next directional move.',
                      'bear→range': 'Bear markets frequently transition to range as selling pressure exhausts.',
                      'bull→bear': 'Direct bull-to-bear transitions are uncommon and typically driven by sudden market shocks.',
                      'bear→bull': 'Bear-to-bull reversals usually signal a strong shift in sentiment and momentum.',
                    }
                    const fromLabel = LABELS[t.from.toLowerCase()] ?? t.from
                    const toLabel = LABELS[t.to.toLowerCase()] ?? t.to
                    const key = `${t.from.toLowerCase()}→${t.to.toLowerCase()}`
                    const framing = FRAMING[key] ?? `This transition pattern has been observed ${t.count} time${t.count > 1 ? 's' : ''}.`

                    return (
                      <div key={`${t.from}-${t.to}`} style={card({ padding: 14 })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: M.text }}>
                            {fromLabel}
                          </span>
                          <span style={{ fontSize: 12, color: M.textMuted }}>→</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: M.text }}>
                            {toLabel}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, color: M.accent,
                            background: M.accentDim, padding: '2px 8px', borderRadius: 8,
                            marginLeft: 'auto',
                          }}>
                            {t.count}×
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: M.textSecondary, lineHeight: 1.5, margin: 0 }}>
                          {framing}
                        </p>
                        <p style={{ fontSize: 10, color: M.textMuted, margin: '4px 0 0', fontFamily: "'DM Mono', monospace" }}>
                          Last seen {new Date(t.last_seen).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    )
                  })
                ) : (
                  <div style={{
                    ...card({ padding: 20 }),
                    background: 'rgba(244,162,97,0.05)',
                    border: `1px solid ${M.borderAccent}`,
                  }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: M.text, margin: '0 0 8px' }}>
                      No transitions recorded yet
                    </p>
                    <p style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.6, margin: 0 }}>
                      The market has remained in a single regime since Meridian started tracking. When the regime shifts, you'll see transition patterns here — showing which conditions typically follow each other.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Timestamp ── */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 10,
                color: M.textSubtle,
                fontFamily: "'DM Mono', monospace",
                padding: '16px 0 8px',
                ...anim(6),
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
