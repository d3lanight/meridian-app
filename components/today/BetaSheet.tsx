// ━━━ BetaSheet ━━━
// v1.1.0 · Sprint 36
// Bottom sheet — beta tracker with "What's working" + "Working on" tabs
// Changelog:
//   v1.1.0 — Content audit: removed "live" from regime detection (accuracy).
//             Renamed "Coming soon" tab → "Working on". Removed subtext sentence.
//             Merged Today AI briefing + Ask Meridian → single generic item (no AI mention).
//             Added: external portfolio integration, sources management, multiple portfolios.
//   v1.0.0 — S177: Initial implementation.

'use client'

import { useState, useEffect } from 'react'
import { X, Check, Clock } from 'lucide-react'
import { M } from '@/lib/meridian'

const FONT_BODY = "'DM Sans', sans-serif"
const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_MONO = "'DM Mono', monospace"

const WORKING = [
  { text: 'Regime detection — bull/bear/range/volatility classification' },
  { text: 'Posture score — portfolio alignment against 4-bucket model' },
  { text: 'Exposure page — allocation breakdown with regime context' },
  { text: 'Pulse page — market regime, signals, and price data' },
  { text: 'Real-time prices — BTC, ETH, and held assets' },
  { text: 'Profile — holdings management, tier, and account settings' },
]

const WORKING_ON = [
  { text: 'Today page — personalized briefings and regime-aware portfolio insights' },
  { text: 'External signal feed — curated posts, research, and market commentary' },
  { text: 'External portfolio integration — connect wallets and exchanges' },
  { text: 'Sources management — control what data feeds your intelligence layer' },
  { text: 'Multiple portfolios — track and compare different portfolio setups' },
  { text: 'Regime alerts — notifications when the market regime shifts' },
  { text: 'Pro tier — advanced analytics, deeper posture breakdowns, and more' },
]

interface BetaSheetProps {
  onClose: () => void
}

export default function BetaSheet({ onClose }: BetaSheetProps) {
  const [tab, setTab] = useState<'working' | 'working-on'>('working')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '78vh', overflow: 'hidden' }}>

      {/* Handle */}
      <div style={{
        width: 36, height: 4, borderRadius: 2,
        background: M.borderSubtle,
        margin: '14px auto 14px', flexShrink: 0,
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px 16px', flexShrink: 0,
        borderBottom: `1px solid ${M.borderSubtle}`,
      }}>
        <div>
          <div style={{
            fontSize: 12, fontWeight: 600, color: M.accent,
            fontFamily: FONT_BODY, letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: 3,
          }}>
            Early Beta
          </div>
          <div style={{
            fontSize: 16, fontWeight: 500, color: M.text,
            fontFamily: FONT_DISPLAY,
          }}>
            Meridian{' '}
            <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: M.textMuted }}>v0.9.1</span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            border: `1px solid ${M.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={14} color={M.textSecondary} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 6,
        padding: '14px 20px 0', flexShrink: 0,
      }}>
        {([
          { key: 'working', label: "✅ What's working" },
          { key: 'working-on', label: '🔨 Working on' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 12,
              border: tab === t.key ? `1px solid ${M.borderAccent}` : `1px solid ${M.borderSubtle}`,
              background: tab === t.key
                ? `linear-gradient(135deg, ${M.accentMuted}, rgba(90,77,138,0.04))`
                : 'rgba(255,255,255,0.4)',
              fontSize: 12, fontWeight: tab === t.key ? 600 : 500,
              color: tab === t.key ? M.accentDeep : M.textSecondary,
              fontFamily: FONT_BODY, cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content — scrollable */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px 28px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {tab === 'working' && WORKING.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'rgba(42,157,143,0.04)',
            border: '1px solid rgba(42,157,143,0.14)',
            borderRadius: 14, padding: '10px 12px',
          }}>
            <Check size={12} color={M.positive} style={{ flexShrink: 0, marginTop: 3 }} />
            <p style={{
              fontSize: 13, color: M.textSecondary,
              lineHeight: 1.55, margin: 0, fontFamily: FONT_BODY,
            }}>{item.text}</p>
          </div>
        ))}

        {tab === 'working-on' && WORKING_ON.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'rgba(123,111,168,0.04)',
            border: `1px solid ${M.borderAccent}`,
            borderRadius: 14, padding: '10px 12px',
          }}>
            <Clock size={12} color={M.accent} style={{ flexShrink: 0, marginTop: 3 }} />
            <p style={{
              fontSize: 13, color: M.textSecondary,
              lineHeight: 1.55, margin: 0, fontFamily: FONT_BODY,
            }}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
