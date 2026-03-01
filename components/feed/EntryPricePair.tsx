// ━━━ EntryPricePair ━━━
// v1.0.0 · ca-story83 · Sprint 20

'use client'

import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import type { EntryPricePairData } from '@/lib/feed-types'

const BTC_ICON = (
  <path
    d="M22.5 14.2c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.6 2.6c-.4-.1-.9-.2-1.3-.3l.7-2.6-1.7-.4-.7 2.7c-.4-.1-.7-.2-1-.2l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 .1.1.1.1.1l-.1 0-1.1 4.5c-.1.2-.3.5-.7.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.7.4.7-2.7c2.8.5 4.9.3 5.8-2.2.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.5zm-3.7 5.2c-.5 2-4 .9-5.1.7l.9-3.7c1.1.3 4.7.8 4.2 3zm.5-5.3c-.5 1.8-3.4.9-4.3.7l.8-3.3c1 .7 4 .7 3.5 2.6z"
    fill="white"
  />
)

const ETH_ICON = (
  <>
    <path d="M16 4l-8 13 8 4.5 8-4.5L16 4z" fill="white" fillOpacity="0.9" />
    <path d="M8 17l8 11 8-11-8 4.5L8 17z" fill="white" fillOpacity="0.7" />
  </>
)

interface CoinCardProps {
  sym: string
  price: number
  change: number
  bg: string
  shadow: string
  icon: React.ReactNode
  hidden: boolean
}

function CoinCard({ sym, price, change, bg, shadow, icon, hidden }: CoinCardProps) {
  const positive = change >= 0
  return (
    <div
      style={{
        ...card({ padding: '12px 14px' }),
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px ${shadow}`,
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 32 32" width={14} height={14}>
          {icon}
        </svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: M.text,
            fontFamily: "'DM Sans', sans-serif",
            fontFeatureSettings: "'tnum' 1, 'lnum' 1",
          }}
        >
          {hidden
            ? '$••••'
            : `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: positive ? M.positive : M.negative,
            fontFamily: "'DM Sans', sans-serif",
            fontFeatureSettings: "'tnum' 1, 'lnum' 1",
          }}
        >
          {hidden ? '••%' : `${positive ? '+' : ''}${change.toFixed(2)}%`}
        </div>
      </div>
    </div>
  )
}

export default function EntryPricePair({
  data,
  hidden = false,
}: {
  data: EntryPricePairData
  hidden?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CoinCard
        sym="BTC"
        price={data.btcPrice}
        change={data.btcChange}
        bg="linear-gradient(135deg, #F7931A, #FF9D2E)"
        shadow="rgba(247,147,26,0.25)"
        icon={BTC_ICON}
        hidden={hidden}
      />
      <CoinCard
        sym="ETH"
        price={data.ethPrice}
        change={data.ethChange}
        bg="linear-gradient(135deg, #627EEA, #8299EF)"
        shadow="rgba(98,126,234,0.25)"
        icon={ETH_ICON}
        hidden={hidden}
      />
    </div>
  )
}
