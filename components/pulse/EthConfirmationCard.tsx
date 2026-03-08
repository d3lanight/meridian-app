// components/pulse/EthConfirmationCard.tsx
// v1.0.0 · S173 · Sprint 35
// ETH confirming or diverging from BTC regime — port of EthConfirmationCard from meridian-pulse-v4.1.jsx

'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import CryptoIcon from '@/components/shared/CryptoIcon'

const FONT_NUM  = "'DM Sans', sans-serif"
const FONT_NUMF = "'tnum' 1, 'lnum' 1"

const REGIME_LABELS: Record<string, string> = {
  bull:      'Bull',
  bear:      'Bear',
  range:     'Range',
  volatile:  'Volatile',
  recovery:  'Recovery',
}

interface EthConfirmationCardProps {
  btcChange: number
  ethChange: number
  regime:    string
}

export default function EthConfirmationCard({ btcChange, ethChange, regime }: EthConfirmationCardProps) {
  const confirming =
    regime === 'bull'  ? ethChange >= 0 :
    regime === 'bear'  ? ethChange <= 0 :
    Math.abs(ethChange - btcChange) < 2

  const divergence  = Math.abs(btcChange - ethChange).toFixed(1)
  const statusColor = confirming ? M.positive  : M.volatility
  const statusLabel = confirming ? 'Confirming' : 'Diverging'
  const statusBg    = confirming ? M.positiveDim : M.volatilityDim
  const regimeLabel = REGIME_LABELS[regime] ?? regime

  return (
    <div style={{ ...card({ padding: 14 }), marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <CryptoIcon symbol="ETH" size={26} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: M.text }}>ETH Confirmation</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: statusColor, background: statusBg, padding: '1px 7px', borderRadius: 6 }}>
              {statusLabel}
            </span>
          </div>
          <p style={{ fontSize: 10, color: M.textMuted, margin: '2px 0 0', lineHeight: 1.4 }}>
            ETH {confirming ? 'aligns with' : 'diverges from'} the {regimeLabel} regime — {divergence}% spread vs BTC
          </p>
        </div>
      </div>

      {/* BTC vs ETH 24h comparison */}
      <div style={{ display: 'flex', gap: 8 }}>
        {/* BTC 24h */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.45)', borderRadius: 10, padding: '7px 10px' }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>BTC 24h</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {btcChange >= 0
              ? <TrendingUp  size={10} color={M.positive}  strokeWidth={2.5} />
              : <TrendingDown size={10} color={M.negative} strokeWidth={2.5} />}
            <span style={{ fontSize: 12, fontWeight: 700, color: btcChange >= 0 ? M.positive : M.negative, fontFamily: FONT_NUM, fontFeatureSettings: FONT_NUMF }}>
              {btcChange >= 0 ? '+' : ''}{btcChange}%
            </span>
          </div>
        </div>

        {/* ETH 24h */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.45)', borderRadius: 10, padding: '7px 10px' }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>ETH 24h</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {ethChange >= 0
              ? <TrendingUp  size={10} color={M.positive}  strokeWidth={2.5} />
              : <TrendingDown size={10} color={M.negative} strokeWidth={2.5} />}
            <span style={{ fontSize: 12, fontWeight: 700, color: ethChange >= 0 ? M.positive : M.negative, fontFamily: FONT_NUM, fontFeatureSettings: FONT_NUMF }}>
              {ethChange >= 0 ? '+' : ''}{ethChange}%
            </span>
          </div>
        </div>

        {/* Spread */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.45)', borderRadius: 10, padding: '7px 10px' }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>Spread</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: confirming ? M.positive : M.volatility, fontFamily: FONT_NUM, fontFeatureSettings: FONT_NUMF }}>
            {divergence}%
          </div>
        </div>
      </div>
    </div>
  )
}
