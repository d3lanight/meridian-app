// ━━━ HoldingCard Component ━━━
// v1.0.0 · ca-story132 · Sprint 28
// Single holding row in the Exposure Holdings section
// Flagged state: red border + badge + subtext when driving misalignment

'use client'

import { M } from '@/lib/meridian'
import CryptoIcon from '@/components/shared/CryptoIcon'

// ─── Props ────────────────────────────────────────────────────────────────────

interface HoldingCardProps {
  symbol:    string
  name?:     string
  iconUrl?:  string | null
  valueUsd:  number
  weightPct: number          // 0–100
  flagged?:  boolean
  hidden?:   boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toFixed(2)}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HoldingCard({
  symbol,
  name,
  iconUrl,
  valueUsd,
  weightPct,
  flagged = false,
  hidden = false,
}: HoldingCardProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 0',
      borderBottom: `1px solid ${M.borderSubtle}`,
      borderLeft: flagged ? '3px solid #EF4444' : '3px solid transparent',
      paddingLeft: flagged ? 10 : 0,
    }}>

      {/* Icon */}
      <CryptoIcon symbol={symbol} size={36} iconUrl={iconUrl} />

      {/* Name + flagged subtext */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: M.text,
          fontFamily: "'Outfit', sans-serif",
        }}>
          {name ?? symbol}
        </div>
        {flagged && (
          <div style={{
            fontSize: 10,
            color: '#EF4444',
            fontFamily: "'Outfit', sans-serif",
            marginTop: 2,
          }}>
            Driving most of your misalignment
          </div>
        )}
        {!flagged && (
          <div style={{
            fontSize: 10,
            color: M.textMuted,
            fontFamily: "'Outfit', sans-serif",
            marginTop: 2,
          }}>
            {symbol}
          </div>
        )}
      </div>

      {/* Value + weight badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: M.text,
          fontFamily: "'Outfit', sans-serif",
          fontFeatureSettings: "'tnum' 1",
        }}>
          {hidden ? '••••' : fmt(valueUsd)}
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: flagged ? '#EF4444' : M.textMuted,
          background: flagged ? 'rgba(239,68,68,0.08)' : M.surfaceLight,
          borderRadius: 6,
          padding: '1px 6px',
          fontFamily: "'Outfit', sans-serif",
          fontFeatureSettings: "'tnum' 1",
        }}>
          {Math.round(weightPct)}%
        </span>
      </div>
    </div>
  )
}
