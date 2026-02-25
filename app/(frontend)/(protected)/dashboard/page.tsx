// ━━━ Dashboard (Home Screen) ━━━
// v0.7.0 · ca-story55 · 2026-02-24
// S55: Confidence Trend Indicator
// Changes from v0.6.0:
//  - Added confidence trend indicator below confidence number in regime card
//  - Trend fetched from /api/market response (confidenceTrend field)
//  - Rising = green up arrow, Declining = red down arrow, Stable = muted right arrow
'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Wifi, WifiOff, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react'
import ProgressiveDisclosure, { DisclosureGroup } from '@/components/education/ProgressiveDisclosure'
import { M } from '@/lib/meridian'
import { useMarketData } from '@/hooks/useMarketData'
import MeridianMark from '@/components/brand/MeridianMark'
import DevTools from '@/components/dev/DevTools'

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

// ── Signal Card (v2 dot style) ────────────────

type SignalTier = 'info' | 'watch' | 'actionable'

const SIGNAL_STYLES: Record<SignalTier, { bg: string; border: string; dot: string }> = {
  info: { bg: 'rgba(42,157,143,0.05)', border: 'rgba(42,157,143,0.2)', dot: M.positive },
  watch: { bg: 'rgba(244,162,97,0.05)', border: 'rgba(244,162,97,0.2)', dot: M.accent },
  actionable: { bg: 'rgba(231,111,81,0.05)', border: 'rgba(231,111,81,0.2)', dot: M.accentDeep },
}

function DashSignalCard({
  type,
  title,
  desc,
  time,
}: {
  type: SignalTier
  title: string
  desc: string
  time: string
}) {
  const c = SIGNAL_STYLES[type] || SIGNAL_STYLES.info
  return (
    <div style={{ background: c.bg, borderRadius: 20, padding: 16, border: `1px solid ${c.border}` }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: c.dot,
            marginTop: 6,
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: M.text, marginBottom: 4 }}>{title}</div>
          <p style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.5, margin: '0 0 6px' }}>{desc}</p>
          <div style={{ fontSize: 10, color: M.textMuted }}>{time}</div>
        </div>
      </div>
    </div>
  )
}

// ── Regime icon helper ────────────────────────

function RegimeIcon({ regime }: { regime: string }) {
  const r = regime.toLowerCase()
  if (r.includes('bull')) return <TrendingUp size={24} color="white" strokeWidth={2.5} />
  if (r.includes('bear')) return <TrendingDown size={24} color="white" strokeWidth={2.5} />
  return <Minus size={24} color="white" strokeWidth={2.5} />
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
    return 'Market shows upward momentum within a defined range. Breakout potential exists, but volatility remains contained.'
  if (r.includes('bear'))
    return 'Market in downward trend with elevated volatility. Risk-off conditions prevail across major assets.'
  return 'Market moving sideways with no clear directional bias. Consolidation phase with moderate activity.'
}

// ── Severity mapping ──────────────────────────

function severityToTier(severity: number): SignalTier {
  if (severity >= 70) return 'actionable'
  if (severity >= 50) return 'watch'
  return 'info'
}

// ── Posture helpers ───────────────────────────

function postureNarrative(posture: string, regime: string): string {
  if (posture === 'Aligned')
    return `Your holdings show moderate alignment with the current ${regime.toLowerCase()} regime. Portfolio exposure is within expected range.`
  if (posture === 'Watch' || posture === 'Moderate')
    return 'Your holdings are drifting from regime targets. Monitor allocation for potential rebalancing.'
  if (posture === 'Misaligned')
    return "Your holdings diverge significantly from the current regime's recommended allocation."
  return 'Add holdings to see portfolio posture analysis.'
}

// ── Confidence Trend (S55) ────────────────────

interface ConfidenceTrend {
  direction: 'rising' | 'declining' | 'stable'
  streak: number
}

function ConfidenceTrendIndicator({ trend }: { trend: ConfidenceTrend | null }) {
  if (!trend || trend.streak === -1) {
    // No trend data or insufficient data — show nothing
    return null
  }

  const config = {
    rising: { Icon: ArrowUp, color: M.positive, label: `Rising for ${trend.streak} days` },
    declining: { Icon: ArrowDown, color: M.negative, label: `Declining for ${trend.streak} days` },
    stable: { Icon: ArrowRight, color: M.textMuted, label: 'Stable' },
  }

  const { Icon, color, label } = config[trend.direction]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
      <Icon size={11} color={color} strokeWidth={2.5} />
      <span style={{ fontSize: 11, color, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [confidenceTrend, setConfidenceTrend] = useState<ConfidenceTrend | null>(null)
  const [regimeExplainer, setRegimeExplainer] = useState<{ summary: string; slug: string } | null>(null)
  const {
    scenario,
    activeScenario,
    setScenario,
    lastAnalysis,
    isLoading,
    error,
    isLive,
    refresh,
  } = useMarketData()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  // S55: Fetch confidence trend from /api/market
  useEffect(() => {
    async function fetchTrend() {
      try {
        const res = await fetch('/api/market')
        if (res.ok) {
          const json = await res.json()
          if (json.confidenceTrend) {
            setConfidenceTrend(json.confidenceTrend)
          }
        }
      } catch {
        // Non-critical — trend indicator just won't show
      }
    }
    fetchTrend()
  }, [])
  
  // S58: Fetch regime explainer from glossary
  useEffect(() => {
    if (!scenario?.regime?.current) return
    const rid = scenario.regime.current.toLowerCase().replace(/\s+/g, '')
    fetch(`/api/glossary?regime=${rid}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const e = Array.isArray(d) ? d[0] : d
        if (e) setRegimeExplainer({ summary: e.summary, slug: e.slug })
      })
      .catch(() => {})
  }, [scenario?.regime?.current])

  const anim = (i: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s`,
  })

  const { regime, portfolio, signals } = scenario
  const postureScore = Math.max(0, 100 - portfolio.misalignment)
  const postureIsAligned = portfolio.posture === 'Aligned'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <DisclosureGroup>
      <DevTools
        activeScenario={activeScenario === 'live' ? 'bull' : activeScenario}
        onScenarioChange={setScenario}
      />

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-1" style={anim(0)}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <MeridianMark size={28} />
            <span
              className="font-display text-lg font-medium"
              style={{ letterSpacing: '-0.02em', color: M.text }}
            >
              Meridian
            </span>
            <div
              className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
              style={{
                color: isLive ? M.positive : M.textMuted,
                background: isLive ? M.positiveDim : M.neutralDim,
              }}
            >
              {isLive ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isLive ? 'LIVE' : 'DEMO'}
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="text-[11px] font-medium rounded-xl px-2.5 py-[5px] flex items-center gap-1.5 border-none cursor-pointer"
            style={{
              color: M.textMuted,
              background: 'rgba(255,255,255,0.4)',
            }}
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
            {lastAnalysis}
          </button>
        </div>
        {error && (
          <div
            className="mt-2 text-[11px] px-3 py-2 rounded-xl"
            style={{ color: M.negative, background: M.negativeDim }}
          >
            Failed to load live data — showing demo. {error}
          </div>
        )}
      </div>

      {/* ── Page Title (matches artifact) ── */}
      <div style={{ padding: '12px 20px 0', ...anim(1) }}>
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 24,
            fontWeight: 500,
            color: M.text,
            margin: '0 0 4px',
          }}
        >
          Today
        </h1>
        <p style={{ fontSize: 14, color: M.textSecondary, margin: 0 }}>{today}</p>
      </div>

      {/* ── Content ── */}
      {isLoading && !mounted ? (
        <div className="px-5 pt-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl animate-pulse"
              style={{ background: M.surfaceLight, height: i === 1 ? 200 : 140 }}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '20px 20px 0' }}>

          {/* ── Market Regime Card ── */}
          <div style={{ ...card(), marginBottom: 16, ...anim(2) }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <div>
                <ProgressiveDisclosure
                  id="regime"
                  summary={
                    <span style={{ fontSize: 12, color: M.textMuted }}>Market Regime</span>
                  }
                  context={regimeExplainer?.summary ?? 'The current market condition based on BTC momentum and volatility.'}
                  learnMoreHref={regimeExplainer ? `/settings/learn/glossary#${regimeExplainer.slug}` : undefined}
                />
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 24,
                    fontWeight: 600,
                    color: M.text,
                  }}
                >
                  {regime.current}
                </div>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: regimeIconBg(regime.current),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RegimeIcon regime={regime.current} />
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
              {regimeNarrative(regime.current)}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: M.positiveDim, borderRadius: 16, padding: 12 }}>
                <div style={{ fontSize: 10, color: M.textMuted, marginBottom: 4 }}>Strength</div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 20,
                    fontWeight: 600,
                    color: M.text,
                  }}
                >
                  {regime.trend}
                </div>
              </div>
              <div style={{ flex: 1, background: M.positiveDim, borderRadius: 16, padding: 12 }}>
                <div style={{ fontSize: 10, color: M.textMuted, marginBottom: 4 }}>Confidence</div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 20,
                    fontWeight: 600,
                    color: M.text,
                  }}
                >
                  {regime.confidence}%
                </div>
                {/* S55: Confidence trend indicator */}
                <ConfidenceTrendIndicator trend={confidenceTrend} />
              </div>
            </div>
          </div>

          {/* ── Portfolio Posture Card ── */}
          <div
            style={{
              ...card({
                background: 'linear-gradient(135deg, rgba(244,162,97,0.1), rgba(231,111,81,0.1))',
                border: `1px solid ${M.borderAccent}`,
              }),
              marginBottom: 16,
              ...anim(3),
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
              <div>
                <div style={{ fontSize: 12, color: M.textMuted, marginBottom: 4 }}>
                  Portfolio Posture
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 36,
                    fontWeight: 600,
                    color: M.text,
                  }}
                >
                  {postureScore}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 12,
                    color: postureIsAligned ? M.positive : M.negative,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  {portfolio.posture}
                </div>
                <div style={{ fontSize: 12, color: M.textSecondary }}>
                  {portfolio.misalignment}% misaligned
                </div>
              </div>
            </div>
            <GradientBar pct={postureScore} />
            <p
              style={{
                fontSize: 14,
                color: M.textSecondary,
                lineHeight: 1.6,
                margin: '12px 0 0',
              }}
            >
              {postureNarrative(portfolio.posture, regime.current)}
            </p>
          </div>

          {/* ── Signals ── */}
          <div style={anim(4)}>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: M.text,
                margin: '0 0 12px',
              }}
            >
              Signals
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {signals.length === 0 ? (
                <div
                  style={{
                    ...card(),
                    textAlign: 'center',
                    padding: '24px 20px',
                  }}
                >
                  <div
                    style={{ fontSize: 12, fontWeight: 500, color: M.textSecondary, marginBottom: 4 }}
                  >
                    No active signals
                  </div>
                  <div style={{ fontSize: 11, color: M.textMuted }}>Market conditions unchanged</div>
                </div>
              ) : (
                signals.map((signal) => (
                  <DashSignalCard
                    key={signal.id}
                    type={severityToTier(signal.severity)}
                    title={signal.asset}
                    desc={signal.reason}
                    time={signal.time}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Last Updated ── */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: M.textMuted,
              padding: '16px 0 8px',
              ...anim(5),
            }}
          >
            Last analysis: {lastAnalysis}
          </div>
        </div>
      )}
    </DisclosureGroup>
  )
}
