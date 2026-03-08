// ━━━ PnlSummary ━━━
// v1.0.0 · S173 · Sprint 35
// Aggregate unrealised P&L card for Exposure page.
// Position: between AllocationCard and Holdings divider.
// Access: all users (not Pro-gated).
// Privacy: all values masked when hidden === true.

'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

// ── Fonts ──────────────────────────────────────
const FONT_MONO = "'DM Mono', monospace"
const FONT_BODY = "'DM Sans', sans-serif"

// ── Helpers ────────────────────────────────────
function fU(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fP(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

// ── Props ──────────────────────────────────────

interface PnlSummaryProps {
  /** Total invested (cost basis across all holdings) */
  totalCost: number
  /** Total current value */
  totalValue: number
  /** Whether privacy mode is active */
  hidden?: boolean
}

// ── Component ──────────────────────────────────

export default function PnlSummary({ totalCost, totalValue, hidden = false }: PnlSummaryProps) {
  const pnl    = totalValue - totalCost
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0
  const up     = pnl >= 0

  const borderColor = up ? M.borderPositive : 'rgba(231,111,81,0.2)'
  const bgGradient  = up
    ? `linear-gradient(135deg, ${M.positiveDim}, rgba(255,255,255,0.3))`
    : `linear-gradient(135deg, ${M.negativeDim}, rgba(255,255,255,0.3))`
  const signColor   = up ? M.positive : M.negative
  const dimColor    = up ? M.positiveDim : M.negativeDim

  return (
    <div style={{
      ...card({ padding: 14 }),
      background: bgGradient,
      border: `1px solid ${borderColor}`,
      marginBottom: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        {/* Left: icon + label + amount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: dimColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {up
              ? <TrendingUp size={15} color={M.positive} />
              : <TrendingDown size={15} color={M.negative} />
            }
          </div>
          <div>
            <div style={{
              fontSize: 10, color: M.textMuted,
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
              fontFamily: FONT_BODY,
            }}>
              Unrealized P&L
            </div>
            <div style={{
              fontSize: 16, fontWeight: 600,
              fontFamily: FONT_MONO, color: signColor,
            }}>
              {hidden ? '$••••' : `${up ? '+' : '-'}${fU(pnl)}`}
            </div>
          </div>
        </div>

        {/* Right: % badge */}
        <div style={{
          padding: '5px 12px', borderRadius: 10, background: dimColor,
        }}>
          <span style={{
            fontSize: 13, fontWeight: 600,
            fontFamily: FONT_MONO, color: signColor,
          }}>
            {hidden ? '••%' : fP(pnlPct)}
          </span>
        </div>
      </div>

      {/* Sub row: cost basis + current value */}
      <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
        <div>
          <div style={{
            fontSize: 9, color: M.textMuted,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
            fontFamily: FONT_BODY,
          }}>
            Cost basis
          </div>
          <span style={{ fontSize: 12, fontFamily: FONT_MONO, color: M.textSecondary }}>
            {hidden ? '$••••' : fU(totalCost)}
          </span>
        </div>
        <div>
          <div style={{
            fontSize: 9, color: M.textMuted,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
            fontFamily: FONT_BODY,
          }}>
            Current value
          </div>
          <span style={{ fontSize: 12, fontFamily: FONT_MONO, color: M.text }}>
            {hidden ? '$••••' : fU(totalValue)}
          </span>
        </div>
      </div>
    </div>
  )
}
