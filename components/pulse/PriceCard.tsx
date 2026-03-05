// ━━━ PriceCard ━━━ v1.2.0 · S162
// Uses shared CryptoIcon with iconUrl (same pattern as portfolio)
'use client'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import CryptoIcon from '@/components/shared/CryptoIcon'

const NUM_STYLE = { fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }

interface PriceCardProps { symbol: string; name: string; price: number; change: number; iconUrl?: string | null }

export default function PriceCard({ symbol, name, price, change, iconUrl }: PriceCardProps) {
  const up = change >= 0
  const cc = up ? M.positive : M.negative
  const bg = up ? M.positiveDim : M.negativeDim
  return (
    <div style={{ ...card({ padding: 14 }), flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <CryptoIcon symbol={symbol} iconUrl={iconUrl} size={28} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: M.text, ...NUM_STYLE }}>{symbol}</div>
          <div style={{ fontSize: 10, color: M.textMuted }}>{name}</div>
        </div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: M.text, ...NUM_STYLE, marginBottom: 6, lineHeight: 1 }}>
        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: bg, borderRadius: 8, padding: '3px 8px' }}>
        <span style={{ fontSize: 11, color: cc, fontWeight: 600 }}>{up ? '↑' : '↓'}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: cc, ...NUM_STYLE }}>{up ? '+' : ''}{change.toFixed(2)}%</span>
        <span style={{ fontSize: 9, color: cc, opacity: 0.7 }}>24h</span>
      </div>
    </div>
  )
}
