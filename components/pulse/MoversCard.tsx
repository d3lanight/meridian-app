// ━━━ MoversCard ━━━ v2.0.0 · S162
// Live data from /api/top-movers (asset_prices table)
'use client'
import { useState, useEffect } from 'react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import CryptoIcon from '@/components/shared/CryptoIcon'

const NUM_STYLE = { fontFamily: "'DM Sans', sans-serif", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }

interface Mover { symbol: string; name: string; price: number; change_24h: number; icon_url?: string | null }

function MoverRow({ symbol, name, price, change_24h, icon_url }: Mover) {
  const up = change_24h >= 0
  const cc = up ? M.positive : M.negative
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${M.borderSubtle}` }}>
      <CryptoIcon symbol={symbol} iconUrl={icon_url} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>{name}</div>
        <div style={{ fontSize: 10, color: M.textMuted }}>{symbol}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: M.text, ...NUM_STYLE }}>${price.toLocaleString('en-US', { maximumFractionDigits: price < 1 ? 4 : 2 })}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: cc, ...NUM_STYLE }}>{up ? '+' : ''}{change_24h.toFixed(1)}%</span>
      </div>
    </div>
  )
}

function MoversSkeleton() {
  return (
    <div style={{ ...card({ padding: 16 }), marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 32, background: M.surfaceLight, borderRadius: 12 }} className="animate-pulse" />
        <div style={{ flex: 1, height: 32, background: M.surfaceLight, borderRadius: 12 }} className="animate-pulse" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${M.borderSubtle}` }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: M.surfaceLight }} className="animate-pulse" />
          <div style={{ flex: 1, height: 16, background: M.surfaceLight, borderRadius: 8 }} className="animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function MoversCard() {
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers')
  const [gainers, setGainers] = useState<Mover[]>([])
  const [losers, setLosers] = useState<Mover[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/top-movers')
      .then(r => r.json())
      .then(d => {
        setGainers(d.gainers ?? [])
        setLosers(d.losers ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <MoversSkeleton />

  const list = tab === 'gainers' ? gainers : losers
  const empty = list.length === 0

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
      {empty ? (
        <p style={{ fontSize: 12, color: M.textMuted, textAlign: 'center', padding: '12px 0' }}>
          No {tab} in the last 24h
        </p>
      ) : (
        <div>{list.map(m => <MoverRow key={m.symbol} {...m} />)}</div>
      )}
    </div>
  )
}
