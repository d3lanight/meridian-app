// components/portfolio/PriceContext.tsx
// v1.0.0 · S165 · Sprint 35
// Pro section inside holding card: sparkline + beta badge + 30d high/low range bar.
// Privacy-aware: masks values when hidden.

import { M } from '@/lib/meridian'
import Sparkline from '@/components/shared/Sparkline'
import BetaBadge from '@/components/portfolio/BetaBadge'

const FONT_MONO = "'DM Mono', monospace"
const FONT_NUM = "'DM Sans', sans-serif"

interface PriceContextProps {
  sparkline: number[]
  beta: number
  high30d: number
  low30d: number
  current: number
  change30d: number
  hidden: boolean
}

export default function PriceContext({
  sparkline, beta, high30d, low30d, current, change30d, hidden,
}: PriceContextProps) {
  const up = change30d >= 0
  const pctInRange = high30d !== low30d
    ? ((current - low30d) / (high30d - low30d)) * 100
    : 50
  const color = up ? M.positive : M.negative

  const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
  const fmtUsd = (n: number) => {
    if (n >= 1) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    if (n >= 0.01) return `$${n.toFixed(4)}`
    return `$${n.toPrecision(3)}`
  }

  return (
    <div style={{
      marginTop: 10,
      padding: '10px 12px',
      borderRadius: 12,
      background: 'rgba(255,255,255,0.4)',
      border: `1px solid ${M.border}`,
    }}>
      {/* Header row: 30d label + change | beta badge */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 9, color: M.textMuted,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            30d price
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600,
            fontFamily: FONT_NUM, fontFeatureSettings: "'tnum' 1, 'lnum' 1",
            color,
          }}>
            {hidden ? '••%' : fmtPct(change30d)}
          </span>
        </div>
        <BetaBadge beta={beta} />
      </div>

      {/* Sparkline */}
      <div style={{ marginBottom: 8 }}>
        <Sparkline
          data={hidden ? sparkline.map(() => 50) : sparkline}
          color={color}
          w={260}
          h={36}
        />
      </div>

      {/* 30d range bar with position dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 9, color: M.textMuted, fontFamily: FONT_MONO, whiteSpace: 'nowrap',
        }}>
          {hidden ? '$••••' : fmtUsd(low30d)}
        </span>
        <div style={{
          flex: 1, height: 4, borderRadius: 4,
          background: M.surfaceLight, position: 'relative',
        }}>
          {!hidden && (
            <div style={{
              position: 'absolute',
              left: `${Math.max(0, Math.min(100, pctInRange))}%`,
              top: -2,
              width: 8, height: 8, borderRadius: '50%',
              background: color,
              border: '1.5px solid white',
              transform: 'translateX(-50%)',
              boxShadow: `0 1px 4px ${color}44`,
            }} />
          )}
        </div>
        <span style={{
          fontSize: 9, color: M.textMuted, fontFamily: FONT_MONO, whiteSpace: 'nowrap',
        }}>
          {hidden ? '$••••' : fmtUsd(high30d)}
        </span>
      </div>
    </div>
  )
}
