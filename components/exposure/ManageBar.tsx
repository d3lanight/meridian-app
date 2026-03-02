// ━━━ ManageBar ━━━
// v1.0.0 · ca-story133 · Sprint 27
// Sticky bar above BottomNav — links to /exposure/portfolio
'use client'

import { Wallet, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { M } from '@/lib/meridian'
import { usePrivacy } from '@/contexts/PrivacyContext'

interface ManageBarProps {
  count: number
  total: number
}

export default function ManageBar({ count, total }: ManageBarProps) {
  const router = useRouter()
  const { hidden } = usePrivacy()

  if (count === 0) return null

  const formattedTotal = total.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 97,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 428,
        padding: '0 12px',
        zIndex: 40,
      }}
    >
      <button
        onClick={() => router.push('/exposure/portfolio')}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid rgba(255,255,255,0.9)`,
          borderRadius: 20,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${M.accentDim}, ${M.accentMuted})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Wallet size={16} color={M.accentDeep} />
        </div>

        {/* Label + count */}
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: M.text }}>
            Manage holdings
          </div>
          <div style={{ fontSize: 11, color: M.textMuted, marginTop: 1 }}>
            {count} {count === 1 ? 'asset' : 'assets'} ·{' '}
            <span style={{ fontFamily: "'DM Mono', monospace" }}>
              {hidden ? '••••••' : formattedTotal}
            </span>
          </div>
        </div>

        <ChevronRight size={16} color={M.textMuted} />
      </button>
    </div>
  )
}