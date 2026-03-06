// v1.1.0 · S164 · Sprint 34
// ProFeaturesCta — generic Pro teaser, features TBD
// Changelog:
//   v1.1.0 — S164: Remove specific feature list (offerings not finalized)
//   v1.0.0 — S134: Initial with 3 features

'use client'

import { Lock, ChevronRight } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import Link from 'next/link'

export default function ProFeaturesCta() {
  return (
    <Link href="/profile" style={{ textDecoration: 'none' }}>
      <div style={{
        ...card({ padding: '12px 16px', borderRadius: 16 }),
        display: 'flex', alignItems: 'center', gap: 10,
        background: `linear-gradient(135deg, ${M.accentMuted}, rgba(123,111,168,0.06))`,
        border: `1px solid ${M.borderAccent}`,
        cursor: 'pointer', marginTop: 8, marginBottom: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, background: M.accentDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Lock size={14} color={M.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: M.text }}>Exposure Pro</div>
          <div style={{ fontSize: 10, color: M.textMuted, marginTop: 1 }}>
            Advanced exposure tools — coming soon
          </div>
        </div>
        <ChevronRight size={16} color={M.accent} />
      </div>
    </Link>
  )
}
