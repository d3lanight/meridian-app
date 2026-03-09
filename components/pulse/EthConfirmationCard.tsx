// components/pulse/EthConfirmationCard.tsx
// v1.3.0 · Sprint 36
// Changelog:
//   v1.3.0 — Signal hierarchy alignment:
//             Confirming badge → M.accent (indigo) — expected state, business as usual
//             Diverging badge  → M.volatility (amber) — worth watching, not alarming
//             Spread value     → M.text — neutral metric, not directional
//   v1.2.0 — Spread value color changed to M.text (neutral metric).
//   v1.1.0 — Replace hardcoded ETH SVG with iconUrl prop from asset_mapping.
//   v1.0.0 · S173 · Sprint 35 — Initial.

'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import CryptoIcon from '@/components/shared/CryptoIcon'

const FONT_BODY = "'DM Sans', sans-serif"
const FONT_NUMF = "'tnum' 1, 'lnum' 1"

const REGIME_LABELS: Record<string, string> = {
  bull:      'Bull',
  bear:      'Bear',
  range:     'Range',
  volatile:  'Volatile',
  recovery:  'Recovery',
}

interface EthConfirmationCardProps {
  btcChange:   number
  ethChange:   number
  regime:      string
  ethIconUrl?: string | null
}

export default function EthConfirmationCard({ btcChange, ethChange, regime, ethIconUrl }: EthConfirmationCardProps) {
  const confirming =
    regime === 'bull'  ? ethChange >= 0 :
    regime === 'bear'  ? ethChange <= 0 :
    Math.abs(ethChange - btcChange) < 2

  const divergence  = Math.abs(btcChange - ethChange).toFixed(1)

  // Confirming = expected behavior → accent (brand, business as usual)
  // Diverging  = worth watching    → volatility (amber, not alarming)
  const statusColor = confirming ? M.accent     : M.volatility
  const statusBg    = confirming ? M.accentMuted : M.volatilityDim
  const statusLabel = confirming ? 'Confirming'  : 'Diverging'
  const regimeLabel = REGIME_LABELS[regime] ?? regime

  return (
    <div style={{ ...card({ padding: 14 }), marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <CryptoIcon symbol="ETH" iconUrl={ethIconUrl} size={26} />
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
        {/* BTC 24h — directional color valid, it's a price return */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.45)', borderRadius: 10, padding: '7px 10px' }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>BTC 24h</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {btcChange >= 0
              ? <TrendingUp  size={10} color={M.positive}  strokeWidth={2.5} />
              : <TrendingDown size={10} color={M.negative} strokeWidth={2.5} />}
            <span style={{ fontSize: 12, fontWeight: 700, color: btcChange >= 0 ? M.positive : M.negative, fontFamily: FONT_BODY, fontFeatureSettings: FONT_NUMF }}>
              {btcChange >= 0 ? '+' : ''}{btcChange}%
            </span>
          </div>
        </div>

        {/* ETH 24h — directional color valid, it's a price return */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.45)', borderRadius: 10, padding: '7px 10px' }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>ETH 24h</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {ethChange >= 0
              ? <TrendingUp  size={10} color={M.positive}  strokeWidth={2.5} />
              : <TrendingDown size={10} color={M.negative} strokeWidth={2.5} />}
            <span style={{ fontSize: 12, fontWeight: 700, color: ethChange >= 0 ? M.positive : M.negative, fontFamily: FONT_BODY, fontFeatureSettings: FONT_NUMF }}>
              {ethChange >= 0 ? '+' : ''}{ethChange}%
            </span>
          </div>
        </div>

        {/* Spread — neutral metric, always M.text */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.45)', borderRadius: 10, padding: '7px 10px' }}>
          <div style={{ fontSize: 8, color: M.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>Spread</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: M.text, fontFamily: FONT_BODY, fontFeatureSettings: FONT_NUMF }}>
            {divergence}%
          </div>
        </div>
      </div>
    </div>
  )
}
