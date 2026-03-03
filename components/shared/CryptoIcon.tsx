// ━━━ CryptoIcon Component ━━━
// v1.0.0 · ca-story132 · Sprint 28
// Extracted from exposure/portfolio/page.tsx — shared branded coin icon

'use client'

import { M } from '@/lib/meridian'

interface CryptoIconProps {
  symbol:   string
  size?:    number
  iconUrl?: string | null
}

const SEG_COLORS: Record<string, string> = {
  BTC:  '#F7931A',
  ETH:  '#627EEA',
  SOL:  '#9945FF',
  ADA:  '#0033AD',
  DOT:  '#E6007A',
  RUNE: '#33FF99',
  DOGE: '#C3A634',
  USDC: '#2775CA',
  USDT: '#26A17B',
}

export default function CryptoIcon({ symbol, size = 36, iconUrl }: CryptoIconProps) {
  const color = SEG_COLORS[symbol] || '#A78BFA'

  if (iconUrl) {
    return (
      <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
        <img
          src={iconUrl}
          alt={symbol}
          width={size}
          height={size}
          style={{ borderRadius: '50%', background: M.surfaceLight, display: 'block' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fb = e.currentTarget.nextElementSibling as HTMLElement
            if (fb) fb.style.display = 'flex'
          }}
        />
        <div style={{
          width: size, height: size,
          background: `${color}20`,
          borderRadius: '50%',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          top: 0, left: 0,
        }}>
          <span style={{ fontSize: size * 0.38, fontWeight: 700, color }}>
            {symbol.slice(0, 2)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: size, height: size,
      background: `${color}20`,
      borderRadius: '50%',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{ fontSize: size * 0.38, fontWeight: 700, color }}>
        {symbol.slice(0, 2)}
      </span>
    </div>
  )
}
