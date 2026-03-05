// ━━━ MoversCard ━━━ v1.1.0 · S162
// Uses shared CryptoIcon with iconUrl (dynamic, same as portfolio)
// Mock data with CoinGecko CDN URLs — real API will provide these
'use client'
import { useState } from 'react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import CryptoIcon from '@/components/shared/CryptoIcon'

const NUM_STYLE = { fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }

interface Mover { symbol: string; name: string; price: number; change: number; iconUrl?: string }

function MoverRow({ symbol, name, price, change, iconUrl }: Mover) {
  const up = change >= 0
  const cc = up ? M.positive : M.negative
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${M.borderSubtle}` }}>
      <CryptoIcon symbol={symbol} iconUrl={iconUrl} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>{name}</div>
        <div style={{ fontSize: 10, color: M.textMuted }}>{symbol}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: M.text, ...NUM_STYLE }}>${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: cc, ...NUM_STYLE }}>{up ? '+' : ''}{change.toFixed(1)}%</span>
      </div>
    </div>
  )
}

// Mock data — CoinGecko CDN icon URLs. Real API will provide these dynamically.
const GAINERS: Mover[] = [
  { symbol: 'SOL', name: 'Solana', price: 198.40, change: 8.1, iconUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { symbol: 'BTC', name: 'Bitcoin', price: 96420, change: 5.0, iconUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { symbol: 'DOT', name: 'Polkadot', price: 8.45, change: 3.2, iconUrl: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
]
const LOSERS: Mover[] = [
  { symbol: 'ETH', name: 'Ethereum', price: 3580, change: -1.8, iconUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.38, change: -3.4, iconUrl: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
]

export default function MoversCard() {
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers')
  const list = tab === 'gainers' ? GAINERS : LOSERS
  return (
    <div style={{ ...card({ padding: 16 }), marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['gainers', 'losers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '7px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textTransform: 'capitalize',
            background: tab === t ? (t === 'gainers' ? M.positiveDim : M.negativeDim) : 'rgba(255,255,255,0.5)',
            color: tab === t ? (t === 'gainers' ? M.positive : M.negative) : M.textMuted,
          }}>
            {t === 'gainers' ? '↑ Gainers' : '↓ Losers'}
          </button>
        ))}
      </div>
      <div>{list.map(m => <MoverRow key={m.symbol} {...m} />)}</div>
    </div>
  )
}
