// ━━━ Market Pulse Page ━━━
// v4.1.0 · S147/S162 · Sprint 34
// "The market now, alive" — prices, movers, volume, intraday signals, sentiment
// Regime history removed (moved to Exposure)
// Changelog:
//   v4.1.0 — S147: Wire IntradaySignals to live API data (intraday_signals from market-context). Read profiles.tier for Pro gate.
//   v4.0.0 — S162: Full page rewrite, 8 components
'use client'

import { useState, useEffect } from 'react'
import { M } from '@/lib/meridian'
import { anim } from '@/lib/ui-helpers'
import { useAuthSheet } from '@/contexts/AuthSheetContext'
import { User } from 'lucide-react'

import {
  RegimeHero,
  PriceCard,
  StatPill,
  VolumeProfile,
  MoversCard,
  IntradaySignals,
  Indicator,
  CoherenceCard,
} from '@/components/pulse'

import type { IntradaySignal } from '@/components/pulse/IntradaySignals'

// ── Fonts ──────────────────────────────────────
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

// ── Helpers ────────────────────────────────────

function formatVolume(vol: number | null): string {
  if (!vol) return '—'
  const b = vol / 1e9
  if (b >= 1000) return `$${(b / 1000).toFixed(1)}T`
  return `$${Math.round(b)}B`
}

function formatMarketCap(cap: number | null): string {
  if (!cap) return '—'
  const t = cap / 1e12
  if (t >= 1) return `$${t.toFixed(1)}T`
  return `$${Math.round(cap / 1e9)}B`
}

function deriveFearGreedLabel(value: number): string {
  if (value <= 25) return 'Extreme fear'
  if (value <= 45) return 'Fear'
  if (value <= 55) return 'Neutral'
  if (value <= 75) return 'Greed'
  return 'Extreme greed'
}

function deriveAltSeasonLabel(value: number): string {
  if (value < 25) return 'BTC-led — altcoins underperforming'
  if (value < 50) return 'BTC-leaning — limited alt rotation'
  if (value < 75) return 'Alt rotation beginning'
  return 'Alt season — broad outperformance'
}

function buildCoherence(regime: string, fearGreed: number, altSeason: number): string {
  const regimeLabel = regime.charAt(0).toUpperCase() + regime.slice(1)
  const fgDesc = fearGreed > 60 ? 'Greed present' : fearGreed < 40 ? 'Fear dominant' : 'Neutral sentiment'
  const altDesc = altSeason > 50 ? 'altcoins rotating' : 'altcoins underperforming'
  
  if (regime === 'bull') {
    return `${regimeLabel} regime with ${fgDesc.toLowerCase()}. ${altSeason < 50 ? 'Capital hasn\'t rotated yet — this is a BTC-first environment with breakout potential.' : 'Alt rotation underway — broader market participation confirms the trend.'}`
  }
  if (regime === 'bear') {
    return `${regimeLabel} regime. ${fgDesc} with ${altDesc}. Risk management is key — watch for regime transitions.`
  }
  return `${regimeLabel} regime. ${fgDesc} with ${altDesc}. Mixed signals suggest patience.`
}

/** Map API intraday_signals → component props. Reverse so oldest→newest, last = "now". */
function mapIntradaySignals(raw: any[] | undefined): IntradaySignal[] {
  if (!raw || raw.length === 0) return []
  return [...raw].reverse().map((s) => ({
    time: formatIntradayTime(s.time),
    regime: s.regime,
    confidence: Math.round((s.confidence ?? 0) * 100),
    eth_confirming: s.eth_confirming,
  }))
}

/** Format ISO timestamp to "HH:00" display */
function formatIntradayTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    const hh = d.getUTCHours().toString().padStart(2, '0')
    return `${hh}:00`
  } catch {
    return isoString
  }
}

// ── Skeleton ────────────────────────────────────

function PulseSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ height: 24, width: '50%', background: M.surfaceLight, borderRadius: 12 }} className="animate-pulse" />
      <div style={{ height: 90, background: M.surfaceLight, borderRadius: 24 }} className="animate-pulse" />
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ height: 100, flex: 1, background: M.surfaceLight, borderRadius: 24 }} className="animate-pulse" />
        <div style={{ height: 100, flex: 1, background: M.surfaceLight, borderRadius: 24 }} className="animate-pulse" />
      </div>
      <div style={{ height: 60, background: M.surfaceLight, borderRadius: 24 }} className="animate-pulse" />
    </div>
  )
}

// ── Anon CTA ────────────────────────────────────

function AnonCTA({ onAuth }: { onAuth: (t: string) => void }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(42,157,143,0.06), rgba(42,157,143,0.02))`,
      border: `1px solid ${M.borderPositive}`, borderRadius: 24, padding: 16, marginBottom: 12,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: M.positiveDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={16} color={M.positive} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: M.text, marginBottom: 4 }}>Track how this affects your portfolio</div>
          <div style={{ fontSize: 12, color: M.textSecondary, lineHeight: 1.5, marginBottom: 12, fontFamily: FONT_BODY }}>
            Sign in to see your posture score, allocation targets, and what these market signals mean for your holdings.
          </div>
          <button onClick={() => onAuth('Pulse')} style={{
            padding: '8px 16px', borderRadius: 12, background: M.positive, border: 'none',
            color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
          }}>
            Create free account
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────

export default function PulsePage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [regime, setRegime] = useState('range')
  const [confidence, setConfidence] = useState(0)
  const [persistence, setPersistence] = useState(1)
  const [btcPrice, setBtcPrice] = useState(0)
  const [btcChange, setBtcChange] = useState(0)
  const [ethPrice, setEthPrice] = useState(0)
  const [ethChange, setEthChange] = useState(0)
  const [totalVolume, setTotalVolume] = useState<number | null>(null)
  const [fearGreed, setFearGreed] = useState(50)
  const [altSeason, setAltSeason] = useState(30)
  const [btcDom, setBtcDom] = useState(50)
  const [marketCap, setMarketCap] = useState<number | null>(null)
  const [btcIcon, setBtcIcon] = useState<string | null>(null)
  const [ethIcon, setEthIcon] = useState<string | null>(null)
  const [isAnon, setIsAnon] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [intradaySignals, setIntradaySignals] = useState<IntradaySignal[]>([])
  const { openAuth } = useAuthSheet()

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [mcRes, mRes] = await Promise.all([
          fetch('/api/market-context'),
          fetch('/api/market'),
        ])

        if (mcRes.ok) {
          const mc = await mcRes.json()
          if (mc.regimes?.length > 0) {
            const latest = mc.regimes[0]
            setRegime(latest.regime || 'range')
            setConfidence(Math.round((latest.confidence || 0) * 100))
          }
          if (mc.regimes?.length > 1) {
            const current = mc.regimes[0]?.regime
            let days = 1
            for (let i = 1; i < mc.regimes.length; i++) {
              if (mc.regimes[i].regime === current) days++
              else break
            }
            setPersistence(days)
          }
          if (mc.current_prices) {
            const btc = mc.current_prices['BTC']
            const eth = mc.current_prices['ETH']
            if (btc) { setBtcPrice(btc.price); setBtcChange(btc.change_24h); setBtcIcon('https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400') }
            if (eth) { setEthPrice(eth.price); setEthChange(eth.change_24h); setEthIcon('https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628') }
          }

          // S147: Wire intraday signals from API
          setIntradaySignals(mapIntradaySignals(mc.intraday_signals))
        }

        if (mRes.ok) {
          const m = await mRes.json()
          if (m.metrics) {
            setFearGreed(m.metrics.fearGreed ?? 50)
            setAltSeason(m.metrics.altSeason ?? 30)
            setBtcDom(m.metrics.btcDominance ?? 50)
            setTotalVolume(m.metrics.totalVolume ?? null)
          }
        }

        // Check auth + tier
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAnon(!user)
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', user.id)
            .maybeSingle()
          setIsPro(profile?.tier === 'pro')
        }
      } catch {}

      setLoading(false)
    }
    load()
  }, [])

  const fearGreedLabel = deriveFearGreedLabel(fearGreed)
  const altSeasonLabel = deriveAltSeasonLabel(altSeason)

  return (
    <div style={{ padding: '20px 20px 24px' }}>
      {loading ? (
        <PulseSkeleton />
      ) : (
        <>
          {/* Header */}
          <div style={{ ...anim(mounted, 0), marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 500, color: M.text, margin: 0 }}>Market Pulse</h1>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: M.positive, boxShadow: `0 0 8px ${M.positive}66` }} />
            </div>
            <p style={{ fontSize: 12, color: M.textSecondary, margin: 0 }}>Live market snapshot</p>
          </div>

          {/* Regime Hero */}
          <div style={anim(mounted, 1)}>
            <RegimeHero regime={regime} confidence={confidence} persistence={persistence} />
          </div>

          {/* BTC + ETH prices */}
          <div style={{ ...anim(mounted, 2), display: 'flex', gap: 10, marginBottom: 12 }}>
            <PriceCard symbol="BTC" name="Bitcoin" price={btcPrice} change={btcChange} iconUrl={btcIcon} />
            <PriceCard symbol="ETH" name="Ethereum" price={ethPrice} change={ethChange} iconUrl={ethIcon} />
          </div>

          {/* Market stats */}
          <div style={{ ...anim(mounted, 3), display: 'flex', gap: 8, marginBottom: 12 }}>
            <StatPill label="24h Volume" value={formatVolume(totalVolume)} />
            <StatPill label="BTC Dom" value={`${btcDom.toFixed(1)}%`} />
            <StatPill label="Fear & Greed" value={String(fearGreed)} />
          </div>

          {/* Volume Profile — only show when we have data */}
          {totalVolume !== null && (
            <div style={anim(mounted, 4)}>
              <VolumeProfile totalVolume={totalVolume} />
            </div>
          )}

          {/* Gainers / Losers */}
          <div style={anim(mounted, 5)}>
            <MoversCard />
          </div>

          {/* Intraday Signals — S147: live data, hidden when empty */}
          {intradaySignals.length > 0 && (
            <div style={anim(mounted, 6)}>
              <IntradaySignals signals={intradaySignals} isPro={isPro} />
            </div>
          )}

          {/* Sentiment */}
          <div style={{ ...anim(mounted, 7), marginBottom: 4 }}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: M.text, marginBottom: 10 }}>Sentiment</h2>
          </div>

          <div style={anim(mounted, 8)}>
            <Indicator
              label="Fear & Greed"
              value={String(fearGreed)}
              desc={`${fearGreedLabel} — ${fearGreed > 50 ? 'cautious optimism' : 'risk aversion'}`}
              pct={fearGreed}
              gradient={M.accentGradient}
              infoText="Composite score 0–100. Low = fear (risk-off). High = greed (risk-on). 50-75 indicates moderate optimism."
            />
          </div>

          <div style={anim(mounted, 9)}>
            <Indicator
              label="ALT Season Index"
              value={String(altSeason)}
              desc={altSeasonLabel}
              pct={altSeason}
              gradient="linear-gradient(90deg,#14F195,#9945FF)"
              infoText="Measures whether altcoins outperform Bitcoin. High = alts running. Low = BTC leading."
            />
          </div>

          {/* Coherence */}
          <div style={anim(mounted, 10)}>
            <CoherenceCard text={buildCoherence(regime, fearGreed, altSeason)} />
          </div>

          {/* Anon CTA */}
          {isAnon && (
            <div style={anim(mounted, 11)}>
              <AnonCTA onAuth={openAuth} />
            </div>
          )}

          {/* Footer */}
          <div style={{
            ...anim(mounted, 12),
            textAlign: 'center', padding: '8px 0', fontSize: 10, color: M.textMuted,
          }}>
            Market data for educational purposes only.
          </div>
        </>
      )}
    </div>
  )
}
