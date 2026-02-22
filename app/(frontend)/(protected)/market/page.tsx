// ━━━ Market Pulse Screen ━━━
// v1.2.0 · design-unification · 2026-02-22
// Migrated to match meridian-pulse-v2.jsx design artifact
// Renamed from "Market Context" to "Market Pulse"
// Changes: Removed regime timeline, sparklines, volatility section.
//          Added: info tooltips, sentiment indicators, ETH confirmation,
//          volume profile, signal coherence card
'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Check, Activity } from 'lucide-react'
import { M } from '@/lib/meridian'

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

interface MarketContextData {
  regimes: RegimeRow[]
  prices: PriceRow[]
  generated_at: string
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

// ── Info Tooltip Pattern ──────────────────────

function InfoBtn({
  id,
  active,
  onClick,
}: {
  id: string
  active: string | null
  onClick: (id: string | null) => void
}) {
  return (
    <button
      onClick={() => onClick(active === id ? null : id)}
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: 'rgba(139,117,101,0.2)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        width={10}
        height={10}
        viewBox="0 0 24 24"
        fill="none"
        stroke={M.textMuted}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </button>
  )
}

function InfoPanel({ children, visible }: { children: React.ReactNode; visible: boolean }) {
  if (!visible) return null
  return (
    <div style={{ margin: '0 0 12px', padding: 12, background: 'rgba(244,162,97,0.05)', borderRadius: 12 }}>
      <p style={{ fontSize: 11, color: M.textSecondary, lineHeight: 1.6, margin: 0 }}>{children}</p>
    </div>
  )
}

// ── Indicator Card ────────────────────────────

function Indicator({
  label,
  value,
  desc,
  pct,
  gradient,
  infoId,
  info,
  setInfo,
  infoText,
}: {
  label: string
  value: string
  desc: string
  pct: number
  gradient: string
  infoId: string
  info: string | null
  setInfo: (id: string | null) => void
  infoText: string
}) {
  return (
    <div style={{ ...card(), marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: M.text }}>{label}</span>
          <InfoBtn id={infoId} active={info} onClick={setInfo} />
        </div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 600, color: M.text }}>
          {value}
        </span>
      </div>
      <InfoPanel visible={info === infoId}>{infoText}</InfoPanel>
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
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [contextRes, marketRes] = await Promise.all([
          fetch('/api/market-context'),
          fetch('/api/market'),
        ])
        if (contextRes.ok) {
          const json: MarketContextData = await contextRes.json()
          setData(json)
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
        }
      } catch (err) {
        console.error('Market pulse fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: M.textMuted }}>Market Regime</span>
                  <InfoBtn id="regime" active={info} onClick={setInfo} />
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

            <InfoPanel visible={info === 'regime'}>
              The market is categorized as Bull (upward), Bear (downward), Range (sideways), or
              Volatile (unstable). This classification is based on BTC momentum and volatility over
              1-day and 7-day periods.
            </InfoPanel>

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
              info={info}
              setInfo={setInfo}
              infoText="Composite score 0–100. Low = fear (risk-off). High = greed (risk-on). 50-75 typically indicates moderate optimism without euphoria."
            />
            <Indicator
              label="Bitcoin Dominance"
              value={`${btcDom.toFixed(1)}%`}
              desc={domDesc}
              pct={btcDom}
              gradient="linear-gradient(90deg, #F7931A, #F79A1F)"
              infoId="dom"
              info={info}
              setInfo={setInfo}
              infoText="BTC's share of total crypto market cap. Rising = capital consolidating into Bitcoin. Falling = rotating into alts."
            />
            <Indicator
              label="ALT Season Index"
              value={String(altSeason)}
              desc={altDesc}
              pct={altSeason}
              gradient="linear-gradient(90deg, #14F195, #9945FF)"
              infoId="alt"
              info={info}
              setInfo={setInfo}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: M.text }}>Volume Profile</span>
                <InfoBtn id="vol" active={info} onClick={setInfo} />
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 600, color: M.text }}>
                {vol}
              </span>
            </div>
            <InfoPanel visible={info === 'vol'}>
              Market activity level. High volume in bull = reinforcement. High volume in bear =
              panic/capitulation. Low volume in range = indecision.
            </InfoPanel>
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
  )
}
