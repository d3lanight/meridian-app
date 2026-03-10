// components/exposure/HoldingCard.tsx
// v2.5.2 · fix: dynamic price decimals across all value displays (value, pnl, 30d range)
// Replaces v2.5.0

'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Lock } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import CryptoIcon from '@/components/shared/CryptoIcon'
import Sparkline from '@/components/shared/Sparkline'
import BetaBadge from '@/components/portfolio/BetaBadge'

// ─── Helpers (from design) ────────────────────────────────────────────────────

const fU = (n: number) =>
  `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fPrice = (p: number) =>
  `$${Number(p).toLocaleString('en-US', { maximumFractionDigits: p >= 1 ? 2 : p >= 0.01 ? 4 : 8 })}`
const fP = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

// ─── PosturePill (from design) ────────────────────────────────────────────────

function PosturePill({ inPosture, offTarget }: { inPosture: boolean; offTarget: boolean }) {
  if (!inPosture) return (
    <span style={{ fontSize: 9, fontWeight: 500, color: M.textMuted, background: M.neutralDim, padding: '1px 7px', borderRadius: 6 }}>
      Not tracked
    </span>
  )
  if (offTarget) return (
    <span style={{ fontSize: 9, fontWeight: 600, color: M.volatility, background: M.volatilityDim, padding: '1px 7px', borderRadius: 6 }}>
      Off target
    </span>
  )
  return (
    <span style={{ fontSize: 9, fontWeight: 500, color: M.accent, background: M.accentDim, padding: '1px 7px', borderRadius: 6 }}>
      On target
    </span>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
// Mirrors the coin object in HoldingCardMerged exactly.
// All numbers default to 0, sparkline to [] — caller provides real data.

export interface HoldingCardProps {
  symbol:      string
  name:        string
  qty:         number
  price:       number
  addedPrice:  number
  addedDate:   string | null
  pctExposure: number        // 0–100
  change24h:   number
  inPosture:   boolean
  offTarget:   boolean
  sparkline:   number[]
  beta:        number
  high30d:     number
  low30d:      number
  change30d:   number
  hidden:      boolean
  isPro:       boolean
  // optional wiring
  iconUrl?:    string | null
  holdingId?:  string | null
  onEdit?:     (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HoldingCard({
  symbol, name, qty, price, addedPrice, addedDate,
  pctExposure, change24h, inPosture, offTarget,
  sparkline, beta, high30d, low30d, change30d,
  hidden, isPro,
  iconUrl, holdingId, onEdit,
}: HoldingCardProps) {

  const [expanded, setExpanded] = useState(false)

  // ── derived (exact from design) ──
  const addedDateFmt = addedDate
    ? new Date(addedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const value     = qty * price
  const costBasis = qty * addedPrice
  const pnl       = value - costBasis
  const pnlPct    = costBasis > 0 ? (pnl / costBasis) * 100 : 0
  const pnlUp     = pnl >= 0

  const change24hColor = change24h > 0 ? M.positive : change24h < 0 ? M.negative : M.textMuted
  const up30       = change30d >= 0
  const pctInRange = high30d !== low30d ? ((price - low30d) / (high30d - low30d)) * 100 : 50

  const coinGrad = ({
    BTC:  `linear-gradient(90deg, ${M.btcOrange}, #F79A1F)`,
    ETH:  `linear-gradient(90deg, ${M.ethBlue}, #7B9FF5)`,
    SOL:  'linear-gradient(90deg,#14F195,#9945FF)',
    USDC: 'linear-gradient(90deg, #2775CA, #5AA8E5)',
  } as Record<string, string>)[symbol] || M.accentGradient

  const DEC: Record<string, number> = { BTC: 4, ETH: 3, SOL: 2, DOT: 1, DOGE: 0, USDC: 0, AAVE: 2 }
  const qtyFmt = hidden ? '••••' : `${Number(qty).toFixed(DEC[symbol] ?? 2)} ${symbol}`

  return (
    <div style={{
      ...card({ padding: 0, borderRadius: 20 }),
      border: `1px solid ${expanded ? M.borderAccent : M.border}`,
      overflow: 'hidden',
      marginBottom: 10,
      transition: 'border-color 0.2s ease',
    }}>

      {/* ── Collapsed button ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 14px 12px 16px', textAlign: 'left', display: 'block' }}
      >
        {/* Row 1: icon · name · value · chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
          <CryptoIcon symbol={symbol} size={38} iconUrl={iconUrl} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: M.text, fontFamily: "'Outfit', sans-serif" }}>{name}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: M.text, fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1", flexShrink: 0 }}>
            {hidden ? '$••••' : fPrice(value)}
          </span>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: expanded ? M.accentDim : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 2, transition: 'background 0.2s ease' }}>
            {expanded ? <ChevronUp size={13} color={M.accent} /> : <ChevronDown size={13} color={M.textMuted} />}
          </div>
        </div>

        {/* Row 2: qty · 24h change */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 48, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: M.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, letterSpacing: 0.1 }}>
            {qtyFmt}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginRight: 30 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: change24hColor, fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>
              {hidden ? '••%' : `${change24h >= 0 ? '+' : ''}${change24h}%`}
            </span>
            <span style={{ fontSize: 9, color: M.textMuted }}>24h</span>
          </div>
        </div>

        {/* Row 3: posture bar · % · pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 48 }}>
          <span style={{ fontSize: 9, color: M.textMuted, whiteSpace: 'nowrap' }}>Posture</span>
          <div style={{ flex: 1, height: 4, borderRadius: 4, background: M.surfaceLight, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, background: coinGrad, width: `${Math.min(100, pctExposure)}%`, transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: M.textSecondary, fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1", minWidth: 30, textAlign: 'right', flexShrink: 0 }}>
            {hidden ? '••%' : `${pctExposure}%`}
          </span>
          <PosturePill inPosture={inPosture} offTarget={offTarget} />
        </div>
      </button>

      {/* ── Expanded drawer ── */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${M.borderSubtle}`, padding: '14px 16px 16px', background: 'rgba(255,255,255,0.3)' }}>
          {isPro ? (
            <>
              {/* 30d header: label · change · beta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>30d price</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: up30 ? M.positive : M.negative, fontFamily: "'DM Sans', sans-serif" }}>
                    {hidden ? '••%' : fP(change30d)}
                  </span>
                </div>
                <BetaBadge beta={beta} />
              </div>

              {/* Sparkline */}
              <div style={{ marginBottom: 10 }}>
                <Sparkline data={hidden ? sparkline.map(() => 50) : sparkline} color={up30 ? M.positive : M.negative} w={356} h={48} />
              </div>

              {/* 30d range bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 9, color: M.textMuted, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
                  {hidden ? '$••••' : fPrice(low30d)}
                </span>
                <div style={{ flex: 1, height: 4, borderRadius: 4, background: M.surfaceLight, position: 'relative' }}>
                  {!hidden && (
                    <div style={{ position: 'absolute', left: `${Math.max(0, Math.min(100, pctInRange))}%`, top: -3, width: 10, height: 10, borderRadius: '50%', background: up30 ? M.positive : M.negative, border: '1.5px solid white', transform: 'translateX(-50%)', boxShadow: `0 1px 4px ${up30 ? M.positive : M.negative}44` }} />
                  )}
                </div>
                <span style={{ fontSize: 9, color: M.textMuted, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
                  {hidden ? '$••••' : fPrice(high30d)}
                </span>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: M.borderSubtle, marginBottom: 10 }} />

              {/* P&L header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: pnlUp ? M.positiveDim : M.negativeDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {pnlUp ? <TrendingUp size={10} color={M.positive} /> : <TrendingDown size={10} color={M.negative} />}
                </div>
                <span style={{ fontSize: 10, color: M.textMuted }}>Unrealized P&L</span>
                {addedDateFmt && (
                  <span style={{ fontSize: 9, color: M.textMuted }}>· since {hidden ? '•••' : addedDateFmt}</span>
                )}
              </div>

              {/* Added at · Current · P&L */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Added at</div>
                  <span style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1", color: M.textSecondary }}>
                    {hidden ? '$••••' : fPrice(addedPrice)}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Current</div>
                  <span style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1", color: M.text }}>
                    {hidden ? '$••••' : fPrice(price)}
                  </span>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>P&L</div>
                  {hidden ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: M.textMuted, fontFamily: "'DM Sans', sans-serif" }}>$••••</span>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, color: pnlUp ? M.positive : M.negative, fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>
                      {pnlUp ? '+' : ''}{fPrice(pnl)}{' '}
                      <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.75 }}>{fP(pnlPct)}</span>
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Free teaser */
            <div style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', marginBottom: 12 }}>
              <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
                <Sparkline data={sparkline} color={M.accent} w={356} h={44} />
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(240,239,242,0.75)', backdropFilter: 'blur(2px)', gap: 6 }}>
                <Lock size={12} color={M.accent} />
                <span style={{ fontSize: 11, fontWeight: 600, color: M.accent }}>Pro — sparkline &amp; P&L</span>
              </div>
            </div>
          )}

          {/* Edit button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => { e.stopPropagation(); if (holdingId && onEdit) onEdit(holdingId) }}
              style={{ padding: '7px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.6)', border: `1px solid ${M.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: M.textSecondary, fontFamily: "'DM Sans', sans-serif" }}
            >
              Edit holding
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
