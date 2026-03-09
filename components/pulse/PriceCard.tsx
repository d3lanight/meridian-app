// ━━━ PriceCard ━━━
// v1.3.0 · Sprint 36
// Changelog:
//   v1.3.0 — Change pill removed. Plain +2.61% in teal/coral, no background, no arrow, no 24h label.
//   v1.2.0 — CryptoIcon with iconUrl prop.
//   v1.1.0 — S162: Initial.
'use client'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import CryptoIcon from '@/components/shared/CryptoIcon'

const NUM_STYLE = { fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }

interface PriceCardProps { symbol: string; name: string; price: number; change: number; iconUrl?: string | null }

export default function PriceCard({ symbol, name, price, change, iconUrl }: PriceCardProps) {
  const up = change >= 0
  const cc = up ? M.positive : M.negative
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
      {/* Plain colored % — no pill, no arrow, no 24h label */}
      <div style={{ fontSize: 13, fontWeight: 600, color: cc, ...NUM_STYLE }}>
        {up ? '+' : ''}{change.toFixed(2)}%
      </div>
    </div>
  )
}
