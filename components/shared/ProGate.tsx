// ━━━ ProGate ━━━
// v1.0.0 · ca-story90 · Sprint 24
// Wrapper: blurred overlay + upgrade prompt for free users, normal render for Pro

'use client'

import { type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { M } from '@/lib/meridian'

interface ProGateProps {
  children: ReactNode
  isPro: boolean
  label?: string
}

export function ProGate({ children, isPro, label = 'Upgrade to Pro' }: ProGateProps) {
  if (isPro) return <>{children}</>

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16 }}>
      {/* Blurred content preview */}
      <div
        style={{
          filter: 'blur(6px)',
          opacity: 0.5,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        aria-hidden
      >
        {children}
      </div>

      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'rgba(245,241,237,0.6)',
          backdropFilter: 'blur(2px)',
          borderRadius: 16,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: M.accentGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Lock size={16} color="white" strokeWidth={2} />
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: M.text,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 11,
            color: M.textMuted,
          }}
        >
          Unlock with Meridian Pro
        </span>
      </div>
    </div>
  )
}
