// components/pulse/EthConfirmationCard.tsx
// v1.5.0 · S191 · Sprint 39
// Changelog:
//   v1.5.0 — S191: Remove spread value from subtitle text. Spread is a 24h metric
//             but regime classification is window-based — showing a number creates
//             misleading context. Can be revisited if recalculated per-window.
//   v1.4.0 — Removed BTC/ETH/Spread tiles (redundant with PriceCards above).
//             Header row only: icon + badge + subtitle with spread.
//   v1.3.0 — Confirming → M.accent; Diverging → M.volatility; Spread → M.text.
//   v1.2.0 — Spread value color changed to M.text.
//   v1.1.0 — iconUrl prop from asset_mapping.
//   v1.0.0 · S173 · Sprint 35 — Initial.

'use client'

import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import CryptoIcon from '@/components/shared/CryptoIcon'

const FONT_BODY = "'DM Sans', sans-serif"

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


  const statusColor = confirming ? M.accent      : M.volatility
  const statusBg    = confirming ? M.accentMuted  : M.volatilityDim
  const statusLabel = confirming ? 'Confirming'   : 'Diverging'
  const regimeLabel = REGIME_LABELS[regime] ?? regime

  return (
    <div style={{ ...card({ padding: 14 }), marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CryptoIcon symbol="ETH" iconUrl={ethIconUrl} size={26} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: M.text, fontFamily: FONT_BODY }}>ETH Confirmation</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: statusColor, background: statusBg, padding: '1px 7px', borderRadius: 6, fontFamily: FONT_BODY }}>
              {statusLabel}
            </span>
          </div>
          <p style={{ fontSize: 10, color: M.textMuted, margin: '3px 0 0', lineHeight: 1.4, fontFamily: FONT_BODY }}>
            ETH {confirming ? 'aligns with' : 'diverges from'} the {regimeLabel} regime
          </p>
        </div>
      </div>
    </div>
  )
}
