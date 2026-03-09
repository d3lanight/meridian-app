// ━━━ Market Pulse Page ━━━
// v5.0.0 · Sprint 36
// Changelog:
//   v5.0.0 — Signal hierarchy overhaul + accent branding restoration:
//             Neutral/normal states → M.accent (indigo) — brand color, not green
//             Only genuine positive signals → M.positive (teal)
//             Only genuine negative signals → M.negative (coral)
//             Elevated/watch signals → M.volatility (amber)
//             Mkt Volume tile: shows raw $B number + pill inline
//             Collapsed tile 3: F&G replaced with BTC 7d (r_7d, directionally colored)
//             F&G in expanded drawer: label row removed, bar only
//             ALT Season: Mixed/BTC-led → accent; Alt Season → teal; BTC Dom → amber
//             F&G Neutral → accent; Fear → amber; Extreme Fear → coral
//             Vol profile Normal/Low → accent dot + pill
//             BTC Vol 7d Normal/Calm → accent pill
//             btcR7d state added, wired from regimes[0].r_7d
//   v4.9.0 — MarketSignals restructure: visible/collapsed row split.
//   v4.8.0 — S176: isVolatile state + volatile badge on RegimeHero.
//   v4.7.0 — S175: deriveVolumeProfile thresholds; priceVol/vol_7d wired.
//   v4.6.0 — Intraday dot alignment; range→steel blue, volatile→burnt orange.
//   v4.2.0 — S173: EthConfirmationCard added.
//   v4.1.0 — S172: MarketSignals introduced.
//   v4.0.0 — S162: Full page rewrite.
//   v3.0.0 — S147: IntradaySignals wired to live API data.
'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Lock } from 'lucide-react'
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
  time:            string
  regime:          string
  confidence:      number
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

// Low/Normal/High
// Normal/Low → accent (business as usual); High → coral (notable)
function deriveVolumeProfile(vol: number | null): { label: string; color: string } {
  if (!vol) return { label: '—', color: M.textMuted }
  const b = vol / 1e9
  if (b < 60)  return { label: 'Low',    color: M.accent }
  if (b < 120) return { label: 'Normal', color: M.accent }
  return              { label: 'High',   color: M.negative }
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

function formatIntradayTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return '—'
  }
}

function mapIntradaySignals(raw: any[] | undefined): IntradaySignal[] {
  if (!raw || raw.length === 0) return []
  return [...raw].reverse().map(s => ({
    time:           formatIntradayTime(s.time || s.created_at || ''),
    regime:         (s.regime || 'range').replace('_', ''),
    confidence:     Math.round((s.confidence || 0) * 100),
    eth_confirming: s.eth_confirming ?? undefined,
  }))
}

function toRegimeRows(raw: any[]): RegimeRow[] {
  return raw.map(r => ({
    timestamp:  r.timestamp || r.market_timestamp || r.created_at || '',
    regime:     r.regime || r.regime_type || 'range',
    confidence: r.confidence ?? 0,
    price_now:  r.price_now ?? 0,
  }))
}

// ── Regime Icons (SVG, no emoji) ────────────────
function RegimeIcon({ regime, size = 20, color = 'white' }: { regime: string; size?: number; color?: string }) {
  if (regime === 'bull') return <TrendingUp size={size} color={color} strokeWidth={2.5} />
  if (regime === 'bear') return <TrendingDown size={size} color={color} strokeWidth={2.5} />
  if (regime === 'range') return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 10h14M3 10l3-3M3 10l3 3M17 10l-3-3M17 10l-3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (regime === 'volatility') return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 3v14M10 3l-3 3M10 3l3 3M10 17l-3-3M10 17l3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  return null
}

// ── Intraday Block ─────────────────────────────
const RC_INTRA: Record<string, { label: string; color: string; dim: string; bg: string }> = {
  bull:       { label: 'Bull',     color: M.positive,  dim: M.positiveDim,         bg: 'linear-gradient(135deg,#2A9D8F,#3DB8A9)' },
  bear:       { label: 'Bear',     color: M.negative,  dim: M.negativeDim,         bg: 'linear-gradient(135deg,#E76F51,#F08C70)' },
  range:      { label: 'Range',    color: '#5B7FA6', dim: 'rgba(91,127,166,0.12)', bg: 'linear-gradient(135deg,#5B7FA6,#7299BE)' },
  volatility: { label: 'Volatile', color: '#C8782A', dim: 'rgba(200,120,42,0.12)', bg: 'linear-gradient(135deg,#C8782A,#D9904A)' },
}

function IntradayBlock({ signals, isPro }: { signals: IntradaySignal[]; isPro: boolean }) {
  if (!isPro) {
    return (
      <div style={{ background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.06))`, border: `1px solid ${M.borderAccent}`, borderRadius: 20, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: M.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock size={16} color={M.accent} />
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
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: M.text }}>Intraday Regime Signals</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {displaySignals.map((s, i) => {
          const rc = RC_INTRA[s.regime] || RC_INTRA.range
          const isNow = i === 0
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: isNow ? rc.dim : 'transparent', border: isNow ? `1px solid ${rc.color}22` : '1px solid transparent' }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: M.textMuted, width: 42, flexShrink: 0 }}>{s.time}</span>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: isNow ? rc.bg : rc.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RegimeIcon regime={s.regime} size={11} color={isNow ? 'white' : rc.color} />
              </div>
              <span style={{ fontSize: 12, fontWeight: isNow ? 600 : 400, color: isNow ? M.text : M.textSecondary, flex: 1, fontFamily: FONT_BODY }}>{rc.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                {isNow && <div style={{ width: 5, height: 5, borderRadius: '50%', background: rc.color, boxShadow: `0 0 6px ${rc.color}` }} />}
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: isNow ? rc.color : M.textMuted, fontWeight: 600 }}>{s.confidence}%</span>
              </div>
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

// ── Status Pill ──────────────────────────────────
function StatusPill({ label, color }: { label: string; color: string }) {
  const bg = color === M.accent    ? M.accentMuted
    : color === M.negative         ? M.negativeDim
    : color === M.volatility       ? M.volatilityDim
    : color === M.positive         ? M.positiveDim
    : color === M.btcOrange        ? 'rgba(247,147,26,0.12)'
    : 'rgba(139,117,101,0.1)'
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, color,
      background: bg, padding: '2px 6px', borderRadius: 6,
      letterSpacing: 0.2, fontFamily: FONT_BODY, lineHeight: 1,
      flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

// ── Skeleton ───────────────────────────────────

function PulseSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[90, 72, 52, 52].map((h, i) => (
        <div key={i} className="animate-pulse" style={{ height: h, borderRadius: 24, background: M.surfaceLight }} />
      ))}
    </div>
  )
}

// ── Anon CTA ───────────────────────────────────

function AnonCTA({ onAuth }: { onAuth: (trigger: string) => void }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.04))`,
      border: `1px solid ${M.borderAccent}`,
      borderRadius: 24, padding: 20, marginBottom: 12,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: M.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={16} color={M.accent} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: M.text, fontFamily: FONT_BODY }}>Track your exposure</div>
          <div style={{ fontSize: 11, color: M.textMuted, fontFamily: FONT_BODY }}>See how your portfolio aligns with the current regime</div>
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

// ── MarketSignals ───────────────────────────────
//
// Visible row:   24h Vol | Mkt Volume ($+pill) | BTC Vol 7d (%+pill)
// Collapsed row: BTC Dom | ALT Season          | BTC 7d (r_7d, directional)
//
// Signal hierarchy:
//   M.accent     — neutral / business as usual (Normal, Mixed, Confirming)
//   M.positive   — genuinely bullish (Alt Season active, Greed)
//   M.negative   — worth noting (High vol, Extreme Fear)
//   M.volatility — watch / elevated (Elevated vol, Fear, BTC Dom heavy)
//   M.text       — raw numeric context (BTC Dom %, BTC 7d near-zero)

interface MarketSignalsProps {
  totalVolume: number | null
  fearGreed:   number
  altSeason:   number
  btcDom:      number
  marketCap:   number | null
  priceVol:    number | null   // 7-day realised BTC price volatility (0–1 decimal)
  btcR7d:      number | null   // BTC 7-day return (0–1 decimal, can be negative)
  mounted:     boolean
}

function MarketSignals({ totalVolume, fearGreed, altSeason, btcDom, marketCap, priceVol, btcR7d, mounted }: MarketSignalsProps) {
  const [open, setOpen] = useState(false)

  // ── Mkt Volume ──
  const vp = deriveVolumeProfile(totalVolume)

  // ── Fear & Greed (expanded bar only, no label row) ──
  const fgColor = fearGreed >= 55 ? M.positive
    : fearGreed >= 45 ? M.accent       // Neutral → accent
    : fearGreed >= 25 ? M.volatility   // Fear → amber
    : M.negative                       // Extreme Fear → coral

  // ── ALT Season ──
  const asColor = altSeason >= 75 ? M.positive    // Alt Season → teal (bullish)
    : altSeason >= 25 ? M.accent                  // Mixed / BTC-led → accent
    : M.volatility                                // BTC Dom heavy → amber (watch)
  const asLabel = altSeason >= 75 ? 'Alt Season'
    : altSeason >= 50 ? 'Mixed'
    : altSeason >= 25 ? 'BTC-led'
    : 'BTC Dom'

  // ── BTC Volatility 7d (visible row) ──
  // % number: always M.text (metric, not directional)
  // Pill: accent for calm/normal, amber for elevated, coral for extreme
  const pvPillColor = priceVol !== null
    ? priceVol > 0.05 ? M.negative
    : priceVol > 0.04 ? M.volatility
    : M.accent   // Normal + Calm → accent
    : M.textMuted
  const pvLabel = priceVol !== null
    ? priceVol > 0.05 ? 'Extreme'
    : priceVol > 0.04 ? 'Elevated'
    : priceVol > 0.015 ? 'Normal'
    : 'Calm'
    : '—'

  // ── BTC 7d return (collapsed tile 3) ──
  // Directional color is valid here — it's a price return
  const r7dPct = btcR7d !== null ? btcR7d * 100 : null
  const r7dColor = r7dPct === null ? M.textMuted
    : r7dPct > 2  ? M.positive
    : r7dPct < -2 ? M.negative
    : M.accent   // Near-zero → accent
  const r7dDisplay = r7dPct !== null
    ? `${r7dPct >= 0 ? '+' : ''}${r7dPct.toFixed(1)}%`
    : '—'

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
      {/* ── Visible row ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
      >
        {/* 24h Vol */}
        <div style={{ flex: 1, padding: '10px 14px', borderRight: `1px solid ${M.borderSubtle}` }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>24h Vol</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: M.text, fontFamily: FONT_BODY }}>{formatVolume(totalVolume)}</div>
        </div>

        {/* Mkt Volume — number + pill inline */}
        <div style={{ flex: 1, padding: '10px 14px', borderRight: `1px solid ${M.borderSubtle}` }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Mkt Volume</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: M.text, fontFamily: FONT_BODY }}>{formatVolume(totalVolume)}</span>
            <StatusPill label={vp.label} color={vp.color} />
          </div>
        </div>

        {/* BTC Vol 7d — % number + pill inline */}
        <div style={{ flex: 1, padding: '10px 14px' }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>BTC Volatility 7d</div>
          {priceVol !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: M.text, fontFamily: FONT_BODY }}>
                {(priceVol * 100).toFixed(1)}%
              </span>
              <StatusPill label={pvLabel} color={pvPillColor} />
            </div>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 700, color: M.textMuted, fontFamily: FONT_BODY }}>—</span>
          )}
        </div>
      </div>

      {/* ── Chevron toggle ── */}
      {!open && (
        <div onClick={() => setOpen(true)} style={{ borderTop: `1px solid ${M.borderSubtle}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', userSelect: 'none', background: 'rgba(255,255,255,0.3)' }}>
          <ChevronDown size={12} color={M.textMuted} style={{ opacity: 0.4 }} />
        </div>
      )}

      {/* ── Collapsed row ── */}
      {open && (
        <div style={{ borderTop: `1px solid ${M.borderSubtle}`, padding: '12px 14px 14px' }}>
          <div onClick={() => setOpen(false)} style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            <ChevronUp size={12} color={M.textMuted} style={{ opacity: 0.4 }} />
          </div>

          {/* BTC Dom · ALT Season · BTC 7d */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>BTC Dom</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: M.text, fontFamily: FONT_BODY }}>{btcDom.toFixed(1)}%</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>ALT Season</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: asColor, fontFamily: FONT_BODY }}>{altSeason}</span>
                <StatusPill label={asLabel} color={asColor} />
              </div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 10px' }}>
              <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>BTC 7d</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: r7dColor, fontFamily: FONT_BODY }}>
                {r7dDisplay}
              </div>
            </div>
          </div>

          {/* ALT Season bar */}
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

          {/* Fear & Greed — bar only, no label row */}
          <div>
            <div style={{ position: 'relative', height: 5, borderRadius: 5, background: `linear-gradient(90deg, ${M.negative}, ${M.volatility} 35%, #3DB89A 65%, ${M.positive})`, marginBottom: 3 }}>
              <div style={{ position: 'absolute', left: `${fearGreed}%`, top: '50%', width: 11, height: 11, borderRadius: '50%', background: 'white', border: `2px solid ${fgColor}`, transform: 'translate(-50%, -50%)', boxShadow: `0 1px 4px ${fgColor}55` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 8, color: M.negative, fontFamily: FONT_BODY }}>Fear</span>
              <span style={{ fontSize: 8, color: M.textMuted, fontFamily: FONT_BODY }}>Neutral</span>
              <span style={{ fontSize: 8, color: M.positive, fontFamily: FONT_BODY }}>Greed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────

export default function PulsePage() {
  const [mounted, setMounted]               = useState(false)
  const [loading, setLoading]               = useState(true)
  const [regime, setRegime]                 = useState('range')
  const [confidence, setConfidence]         = useState(0)
  const [persistence, setPersistence]       = useState(1)
  const [regimeHistory, setRegimeHistory]   = useState<RegimeRow[]>([])
  const [btcPrice, setBtcPrice]             = useState(0)
  const [btcChange, setBtcChange]           = useState(0)
  const [ethPrice, setEthPrice]             = useState(0)
  const [ethChange, setEthChange]           = useState(0)
  const [totalVolume, setTotalVolume]       = useState<number | null>(null)
  const [fearGreed, setFearGreed]           = useState(50)
  const [altSeason, setAltSeason]           = useState(30)
  const [btcDom, setBtcDom]                 = useState(50)
  const [marketCap, setMarketCap]           = useState<number | null>(null)
  const [priceVol, setPriceVol]             = useState<number | null>(null)
  const [btcR7d, setBtcR7d]                 = useState<number | null>(null)   // BTC 7d return
  const [isVolatile, setIsVolatile]         = useState(false)
  const [btcIcon, setBtcIcon]               = useState<string | null>(null)
  const [ethIcon, setEthIcon]               = useState<string | null>(null)
  const [isAnon, setIsAnon]                 = useState(true)
  const [isPro, setIsPro]                   = useState(false)
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
            setPriceVol(latest.vol_7d ?? null)
            setBtcR7d(latest.r_7d ?? null)           // Wire BTC 7d return
            setIsVolatile(latest.is_volatile ?? false)

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

          {/* Regime Hero */}
          <div style={anim(mounted, 1)}>
            <RegimeHero
              regime={regime}
              confidence={confidence}
              persistence={persistence}
              regimeHistory={regimeHistory}
              isPro={isPro}
              isVolatile={isVolatile}
            />
          </div>

          {/* BTC + ETH prices */}
          <div style={{ ...anim(mounted, 2), display: 'flex', gap: 10, marginBottom: 12 }}>
            <PriceCard symbol="BTC" name="Bitcoin"  price={btcPrice} change={btcChange} iconUrl={btcIcon} />
            <PriceCard symbol="ETH" name="Ethereum" price={ethPrice} change={ethChange} iconUrl={ethIcon} />
          </div>

          {/* Market Signals */}
          <MarketSignals
            totalVolume={totalVolume}
            fearGreed={fearGreed}
            altSeason={altSeason}
            btcDom={btcDom}
            marketCap={marketCap}
            priceVol={priceVol}
            btcR7d={btcR7d}
            mounted={mounted}
          />

          {/* ETH Confirmation */}
          <div style={anim(mounted, 4)}>
            <EthConfirmationCard btcChange={btcChange} ethChange={ethChange} regime={regime} ethIconUrl={ethIcon} />
          </div>

          {/* Gainers / Losers */}
          <div style={anim(mounted, 4)}>
            <MoversCard />
          </div>

          {/* Intraday Signals */}
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
