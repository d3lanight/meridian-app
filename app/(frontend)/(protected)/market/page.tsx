// ━━━ Market Pulse Page ━━━
// v4.2.0 · S173 · Sprint 35 — EthConfirmationCard added after RegimeHero
// "The market now, alive" — prices, regime history, market signals, movers, intraday
//
// Changelog:
//   v4.2.0 — S173: EthConfirmationCard added between RegimeHero and PriceCards.
//   v4.1.0 — S172: RegimeHero gains collapsible regime history drawer (7d/30d/90d).
//            MarketSignals replaces StatPills + VolumeProfile + Indicator cards.
//            ExpandableCard added to barrel.
//            Dead code after this story: VolumeProfile, StatPill (pulse/), Indicator.
//   v4.0.0 — S162: Full page rewrite, 8 components.
//   v3.0.0 — S147: IntradaySignals wired to live API data.
'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { M } from '@/lib/meridian'
import { anim } from '@/lib/ui-helpers'
import { useAuthSheet } from '@/contexts/AuthSheetContext'
import { User } from 'lucide-react'

import {
  RegimeHero,
  PriceCard,
  MoversCard,
  CoherenceCard,
  EthConfirmationCard,
} from '@/components/pulse'

import type { RegimeRow } from '@/lib/regime-utils'

// ── Local intraday type ────────────────────────
interface IntradaySignal {
  time:           string
  regime:         string
  confidence:     number
  eth_confirming?: boolean
}
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY    = "'DM Sans', sans-serif"
const FONT_MONO    = "'DM Mono', monospace"

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

function deriveVolumeProfile(vol: number | null): { label: string; color: string } {
  if (!vol) return { label: '—', color: M.textMuted }
  const b = vol / 1e9
  if (b < 80)  return { label: 'Low',      color: M.textMuted }
  if (b < 200) return { label: 'Moderate', color: M.positive }
  return              { label: 'High',     color: M.negative }
}

function buildCoherence(regime: string, fearGreed: number, altSeason: number): string {
  const regimeLabel = regime.charAt(0).toUpperCase() + regime.slice(1)
  const fgDesc = fearGreed > 60 ? 'Greed present' : fearGreed < 40 ? 'Fear dominant' : 'Neutral sentiment'
  if (regime === 'bull') {
    return `${regimeLabel} regime with ${fgDesc.toLowerCase()}. ${altSeason < 50 ? "Capital hasn't rotated yet — this is a BTC-first environment with breakout potential." : 'Alt rotation underway — broader market participation confirms the trend.'}`
  }
  if (regime === 'bear') {
    return `${regimeLabel} regime. ${fgDesc} with altcoins underperforming. Risk management is key — watch for regime transitions.`
  }
  return `${regimeLabel} regime. ${fgDesc}. Mixed signals suggest patience.`
}

/** Format ISO timestamp → "HH:MM" */
function formatIntradayTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return '—'
  }
}

/** Map API intraday_signals → component props.
 *  API returns newest-first; IntradaySignals treats last item as "now" → reverse to oldest-first.
 *  API confidence is 0–1 decimal; component expects 0–100 integer. */
function mapIntradaySignals(raw: any[] | undefined): IntradaySignal[] {
  if (!raw || raw.length === 0) return []
  return [...raw].reverse().map(s => ({
    time:           formatIntradayTime(s.time || s.created_at || ''),
    regime:         (s.regime || 'range').replace('_', ''),
    confidence:     Math.round((s.confidence || 0) * 100),
    eth_confirming: s.eth_confirming ?? undefined,
  }))
}

/** Map raw API regime rows → RegimeRow[] for regime-utils */
function toRegimeRows(raw: any[]): RegimeRow[] {
  return raw.map(r => ({
    timestamp: r.timestamp || r.market_timestamp || r.created_at || '',
    regime:    r.regime || r.regime_type || 'range',
    confidence: r.confidence ?? 0,
    price_now:  r.price_now ?? 0,
  }))
}

// ── Intraday Block — newest on top ────────────
const RC_INTRA: Record<string, { label: string; icon: string; color: string; dim: string; bg: string }> = {
  bull:       { label: 'Bull',    icon: '↗', color: M.positive,   dim: M.positiveDim,   bg: 'linear-gradient(135deg,#2A9D8F,#3DB8A9)' },
  bear:       { label: 'Bear',    icon: '↘', color: M.negative,   dim: M.negativeDim,   bg: 'linear-gradient(135deg,#E76F51,#F08C70)' },
  range:      { label: 'Range',   icon: '→', color: M.neutral,    dim: 'rgba(139,117,101,0.1)', bg: 'linear-gradient(135deg,#8B7565,#A08B7B)' },
  volatility: { label: 'Volatile',icon: '↕', color: M.volatility, dim: M.volatilityDim, bg: 'linear-gradient(135deg,#D4A017,#E0B030)' },
}

function IntradayBlock({ signals, isPro }: { signals: IntradaySignal[]; isPro: boolean }) {
  if (!isPro) {
    return (
      <div style={{ background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.06))`, border: `1px solid ${M.borderAccent}`, borderRadius: 20, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: M.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 16 }}>⚡</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: M.text, fontFamily: FONT_DISPLAY }}>Intraday Regime Signals</div>
            <div style={{ fontSize: 11, color: M.textMuted, marginTop: 2, fontFamily: FONT_BODY }}>See how the market regime shifts throughout the day. Pro feature.</div>
          </div>
        </div>
      </div>
    )
  }
  if (!signals.length) return null
  const displaySignals = [...signals].reverse()
  return (
    <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: 20, border: `1px solid ${M.border}`, padding: 16, marginBottom: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: M.text }}>Intraday Regime Signals</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: M.accent, background: M.accentDim, padding: '2px 6px', borderRadius: 6, fontFamily: FONT_BODY }}>PRO</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {displaySignals.map((s, i) => {
          const rc = RC_INTRA[s.regime] || RC_INTRA.range
          const isNow = i === 0
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: isNow ? rc.dim : 'transparent', border: isNow ? `1px solid ${rc.color}22` : '1px solid transparent' }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: M.textMuted, width: 42, flexShrink: 0 }}>{s.time}</span>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: isNow ? rc.bg : rc.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: isNow ? 'white' : rc.color, fontWeight: 700 }}>{rc.icon}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: isNow ? 600 : 400, color: isNow ? M.text : M.textSecondary, flex: 1, fontFamily: FONT_BODY }}>{rc.label}</span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: isNow ? rc.color : M.textMuted, fontWeight: 600 }}>{s.confidence}%</span>
              {isNow && <div style={{ width: 5, height: 5, borderRadius: '50%', background: rc.color, boxShadow: `0 0 6px ${rc.color}`, flexShrink: 0 }} />}
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 10, color: M.textMuted, marginTop: 10, lineHeight: 1.5, fontFamily: FONT_BODY }}>
        Regime snapshots every 4 hours. Shows intraday momentum shifts.
      </p>
    </div>
  )
}

// ── Skeleton ────────────────────────────────────

function PulseSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[90, 72, 52, 52].map((h, i) => (
        <div key={i} className="animate-pulse" style={{
          height: h, borderRadius: 24, background: M.surfaceLight,
        }} />
      ))}
    </div>
  )
}

// ── Anon CTA ────────────────────────────────────

function AnonCTA({ onAuth }: { onAuth: (trigger: string) => void }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.04))`,
      border: `1px solid ${M.borderAccent}`,
      borderRadius: 24, padding: 20, marginBottom: 12,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: M.accentDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={16} color={M.accent} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: M.text, fontFamily: FONT_BODY }}>
            Track your exposure
          </div>
          <div style={{ fontSize: 11, color: M.textMuted, fontFamily: FONT_BODY }}>
            See how your portfolio aligns with the current regime
          </div>
        </div>
      </div>
      <button
        onClick={() => onAuth('pulse-cta')}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 16,
          background: M.accentGradient, border: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 600, color: 'white', fontFamily: FONT_BODY,
          boxShadow: `0 4px 16px ${M.accentGlow}`,
        }}
      >
        Sign in
      </button>
    </div>
  )
}

// ── MarketSignals ────────────────────────────────

interface MarketSignalsProps {
  totalVolume:  number | null
  fearGreed:    number
  altSeason:    number
  btcDom:       number
  marketCap:    number | null
  mounted:      boolean
}

function MarketSignals({ totalVolume, fearGreed, altSeason, btcDom, marketCap, mounted }: MarketSignalsProps) {
  const [open, setOpen] = useState(false)

  const vp = deriveVolumeProfile(totalVolume)

  const fgColor = fearGreed >= 75 ? M.negative
    : fearGreed >= 55 ? M.volatility
    : fearGreed >= 45 ? M.neutral
    : fearGreed >= 25 ? M.accent
    : M.positive
  const fgLabel = fearGreed >= 75 ? 'Extreme Greed'
    : fearGreed >= 55 ? 'Greed'
    : fearGreed >= 45 ? 'Neutral'
    : fearGreed >= 25 ? 'Fear'
    : 'Extreme Fear'

  const asColor = altSeason >= 75 ? M.accent
    : altSeason >= 50 ? M.positive
    : altSeason >= 25 ? M.neutral
    : M.btcOrange
  const asLabel = altSeason >= 75 ? 'Alt Season'
    : altSeason >= 50 ? 'Mixed'
    : altSeason >= 25 ? 'BTC-led'
    : 'BTC Dom'

  return (
    <div style={{
      ...anim(mounted, 3),
      background: 'rgba(255,255,255,0.55)',
      borderRadius: 16,
      border: `1px solid ${M.border}`,
      overflow: 'hidden',
      marginBottom: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
      >
        <div style={{ flex: 1, padding: '10px 14px', borderRight: `1px solid ${M.borderSubtle}` }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>24h Vol</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: M.text, fontFamily: FONT_MONO }}>{formatVolume(totalVolume)}</div>
        </div>
        <div style={{ flex: 1, padding: '10px 14px', borderRight: `1px solid ${M.borderSubtle}` }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Vol Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: vp.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: vp.color, fontFamily: FONT_MONO }}>{vp.label}</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '10px 14px' }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Fear &amp; Greed</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: fgColor, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: fgColor, fontFamily: FONT_MONO }}>{fearGreed}</span>
            <span style={{ fontSize: 9, fontWeight: 500, color: fgColor, opacity: 0.8, marginLeft: 2, whiteSpace: 'nowrap' }}>{fgLabel}</span>
          </div>
        </div>
      </div>

      {!open && (
        <div onClick={() => setOpen(true)} style={{ borderTop: `1px solid ${M.borderSubtle}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', userSelect: 'none', background: 'rgba(255,255,255,0.3)' }}>
          <ChevronDown size={12} color={M.textMuted} style={{ opacity: 0.4 }} />
        </div>
      )}

      {open && (
        <div style={{ borderTop: `1px solid ${M.borderSubtle}`, padding: '12px 14px 14px' }}>
          <div onClick={() => setOpen(false)} style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            <ChevronUp size={12} color={M.textMuted} style={{ opacity: 0.4 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {marketCap && (
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 10px' }}>
                <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Mkt Cap</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: M.text, fontFamily: FONT_MONO }}>{formatMarketCap(marketCap)}</div>
              </div>
            )}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>BTC Dom</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: M.text, fontFamily: FONT_MONO }}>{btcDom.toFixed(1)}%</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>ALT Season</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: asColor, fontFamily: FONT_MONO }}>{altSeason}</span>
                <span style={{ fontSize: 9, fontWeight: 500, color: asColor, opacity: 0.85 }}>{asLabel}</span>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ height: 5, borderRadius: 5, background: M.surfaceLight, overflow: 'hidden', marginBottom: 3 }}>
              <div style={{ height: '100%', width: `${altSeason}%`, background: `linear-gradient(90deg, ${M.btcOrange}, ${M.accent} 50%, #14F195)`, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 8, color: M.btcOrange, fontFamily: FONT_BODY }}>BTC</span>
              <span style={{ fontSize: 8, color: M.textMuted, fontFamily: FONT_BODY }}>Mixed</span>
              <span style={{ fontSize: 8, color: '#14F195', fontFamily: FONT_BODY }}>Alts</span>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: M.textSecondary, fontWeight: 500, fontFamily: FONT_BODY }}>Fear &amp; Greed</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: fgColor, fontFamily: FONT_MONO }}>{fearGreed}</span>
                <span style={{ fontSize: 9, color: fgColor, fontWeight: 600, fontFamily: FONT_BODY }}>{fgLabel}</span>
              </div>
            </div>
            <div style={{ position: 'relative', height: 5, borderRadius: 5, background: `linear-gradient(90deg, ${M.positive}, ${M.accent} 35%, ${M.volatility} 65%, ${M.negative})`, marginBottom: 3 }}>
              <div style={{ position: 'absolute', left: `${fearGreed}%`, top: '50%', width: 11, height: 11, borderRadius: '50%', background: 'white', border: `2px solid ${fgColor}`, transform: 'translate(-50%, -50%)', boxShadow: `0 1px 4px ${fgColor}55` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 8, color: M.positive, fontFamily: FONT_BODY }}>Fear</span>
              <span style={{ fontSize: 8, color: M.textMuted, fontFamily: FONT_BODY }}>Neutral</span>
              <span style={{ fontSize: 8, color: M.negative, fontFamily: FONT_BODY }}>Greed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────

export default function PulsePage() {
  const [mounted, setMounted]             = useState(false)
  const [loading, setLoading]             = useState(true)
  const [regime, setRegime]               = useState('range')
  const [confidence, setConfidence]       = useState(0)
  const [persistence, setPersistence]     = useState(1)
  const [regimeHistory, setRegimeHistory] = useState<RegimeRow[]>([])
  const [btcPrice, setBtcPrice]           = useState(0)
  const [btcChange, setBtcChange]         = useState(0)
  const [ethPrice, setEthPrice]           = useState(0)
  const [ethChange, setEthChange]         = useState(0)
  const [totalVolume, setTotalVolume]     = useState<number | null>(null)
  const [fearGreed, setFearGreed]         = useState(50)
  const [altSeason, setAltSeason]         = useState(30)
  const [btcDom, setBtcDom]               = useState(50)
  const [marketCap, setMarketCap]         = useState<number | null>(null)
  const [btcIcon, setBtcIcon]             = useState<string | null>(null)
  const [ethIcon, setEthIcon]             = useState<string | null>(null)
  const [isAnon, setIsAnon]               = useState(true)
  const [isPro, setIsPro]                 = useState(false)
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
          fetch('/api/market-context?days=90'),
          fetch('/api/market'),
        ])

        if (mcRes.ok) {
          const mc = await mcRes.json()
          const regimes: any[] = mc.regimes ?? []

          if (regimes.length > 0) {
            const latest = regimes[0]
            setRegime(latest.regime || 'range')
            setConfidence(Math.round((latest.confidence || 0) * 100))

            let days = 1
            for (let i = 1; i < regimes.length; i++) {
              if (regimes[i].regime === regimes[0].regime) days++
              else break
            }
            setPersistence(days)
          }

          setRegimeHistory(toRegimeRows(regimes))

          if (mc.current_prices) {
            const btc = mc.current_prices['BTC']
            const eth = mc.current_prices['ETH']
            if (btc) {
              setBtcPrice(btc.price)
              setBtcChange(btc.change_24h)
              setBtcIcon('https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400')
            }
            if (eth) {
              setEthPrice(eth.price)
              setEthChange(eth.change_24h)
              setEthIcon('https://coin-images.coingecko.com/coins/images/279/large/ethereum.png?1696501628')
            }
          }

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

  return (
    <div style={{ padding: '20px 20px 24px' }}>
      {loading ? (
        <PulseSkeleton />
      ) : (
        <>
          {/* Header */}
          <div style={{ ...anim(mounted, 0), marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 500, color: M.text, margin: 0 }}>
                Market Pulse
              </h1>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: M.positive, boxShadow: `0 0 8px ${M.positive}66` }} />
            </div>
            <p style={{ fontSize: 12, color: M.textSecondary, margin: 0, fontFamily: FONT_BODY }}>Live market snapshot</p>
          </div>

          {/* Regime Hero — with history drawer */}
          <div style={anim(mounted, 1)}>
            <RegimeHero
              regime={regime}
              confidence={confidence}
              persistence={persistence}
              regimeHistory={regimeHistory}
              isPro={isPro}
            />
          </div>

          {/* ETH Confirmation */}
          <div style={anim(mounted, 2)}>
            <EthConfirmationCard btcChange={btcChange} ethChange={ethChange} regime={regime} />
          </div>

          {/* BTC + ETH prices */}
          <div style={{ ...anim(mounted, 3), display: 'flex', gap: 10, marginBottom: 12 }}>
            <PriceCard symbol="BTC" name="Bitcoin"   price={btcPrice} change={btcChange} iconUrl={btcIcon} />
            <PriceCard symbol="ETH" name="Ethereum"  price={ethPrice} change={ethChange} iconUrl={ethIcon} />
          </div>

          {/* Market Signals */}
          <MarketSignals
            totalVolume={totalVolume}
            fearGreed={fearGreed}
            altSeason={altSeason}
            btcDom={btcDom}
            marketCap={marketCap}
            mounted={mounted}
          />

          {/* Gainers / Losers */}
          <div style={anim(mounted, 4)}>
            <MoversCard />
          </div>

          {/* Intraday Signals — newest on top */}
          {intradaySignals.length > 0 && (
            <div style={anim(mounted, 5)}>
              <IntradayBlock signals={intradaySignals} isPro={isPro} />
            </div>
          )}

          {/* Coherence */}
          <div style={anim(mounted, 6)}>
            <CoherenceCard text={buildCoherence(regime, fearGreed, altSeason)} />
          </div>

          {/* Anon CTA */}
          {isAnon && (
            <div style={anim(mounted, 7)}>
              <AnonCTA onAuth={openAuth} />
            </div>
          )}

          {/* Footer */}
          <div style={{
            ...anim(mounted, 8),
            textAlign: 'center', padding: '8px 0', fontSize: 10, color: M.textMuted, fontFamily: FONT_BODY,
          }}>
            Market data for educational purposes only.
          </div>
        </>
      )}
    </div>
  )
}
