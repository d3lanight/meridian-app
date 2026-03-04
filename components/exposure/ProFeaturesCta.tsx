// v1.0.0 · ca-story134 · Sprint 29
// ProFeaturesCta — single conversion point linking to Profile page
// Lists 3 Pro features, accent gradient border

'use client'

import { Lock } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import Link from 'next/link'

const PRO_FEATURES = [
  'Regime history per coin',
  'Exclude from exposure',
  'Scenario analysis',
]

export default function ProFeaturesCta() {
  return (
    <Link href="/profile" style={{ textDecoration: 'none' }}>
      <div style={{
        ...card({ padding: '16px 18px' }),
        marginTop: 16,
        marginBottom: 12,
        border: `1px solid ${M.borderAccent}`,
        background: 'linear-gradient(135deg, rgba(123,111,168,0.08), rgba(90,77,138,0.05))',
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: M.accentGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Lock size={13} color="white" />
          </div>
          <span style={{
            fontSize: 14, fontWeight: 600, color: M.text,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Unlock Pro Exposure
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 38 }}>
          {PRO_FEATURES.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 4, height: 4, borderRadius: '50%',
                background: M.accent, flexShrink: 0,
              }} />
              <span style={{
                fontSize: 12, color: M.textSecondary,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {f}
              </span>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 12, marginLeft: 38,
          fontSize: 12, fontWeight: 600, color: M.accentDeep,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Learn more →
        </div>
      </div>
    </Link>
  )
}