// ━━━ Exposure Page ━━━
// v0.1.0 · ca-story128 · Sprint 27
// Stub — content built in S130-S136
'use client'

import { useState, useEffect } from 'react'
import { M } from '@/lib/meridian'
import { card, anim } from '@/lib/ui-helpers'
import { usePrivacy } from '@/contexts/PrivacyContext'

export default function ExposurePage() {
  const [mounted, setMounted] = useState(false)
  const { hidden, toggleHidden } = usePrivacy()

  useEffect(() => { setMounted(true) }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: M.bg,
      padding: '20px 16px 100px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: M.text }}>
          Exposure
        </h1>
      </div>

      <div style={{
        ...card(),
        padding: 32,
        textAlign: 'center' as const,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.4s ease',
      }}>
        <p style={{ color: M.textSecondary, fontSize: 15 }}>
          Exposure view in progress — posture, allocation, and holdings coming in Sprint 28.
        </p>
      </div>
    </div>
  )
}
