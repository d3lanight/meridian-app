// ━━━ Portfolio Posture Card ━━━
// v0.5.0 · ca-story66 · 2026-02-21
// Meridian v2: glassmorphic, 24px radius, warm palette

'use client'

import { CheckCircle, AlertTriangle, Inbox } from 'lucide-react'
import { M } from '@/lib/meridian'
import type { PortfolioData } from '@/types'
import AllocationBar from './AllocationBar'

interface PostureCardProps {
  data: PortfolioData
}

function getPostureStyle(posture: string) {
  switch (posture) {
    case 'Aligned':
      return { icon: CheckCircle, color: M.positive, bg: M.positiveDim }
    case 'Watch':
      return { icon: AlertTriangle, color: M.accent, bg: M.accentMuted }
    case 'Misaligned':
      return { icon: AlertTriangle, color: M.negative, bg: M.negativeDim }
    default:
      return { icon: Inbox, color: M.textMuted, bg: M.neutralDim }
  }
}

export default function PostureCard({ data }: PostureCardProps) {
  const isEmptyState = data.posture === 'No Data'
  const style = getPostureStyle(data.posture)
  const Icon = style.icon

  return (
    <div
      className="rounded-3xl p-5 mb-3"
      style={{
        background: 'linear-gradient(135deg, rgba(244,162,97,0.1), rgba(231,111,81,0.1))',
        backdropFilter: M.surfaceBlur,
        WebkitBackdropFilter: M.surfaceBlur,
        border: `1px solid ${M.borderAccent}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div
            className="text-[10px] font-semibold font-body mb-1.5"
            style={{ letterSpacing: '0.1em', color: M.textMuted }}
          >
            PORTFOLIO POSTURE
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: style.bg }}
            >
              <Icon size={14} color={style.color} />
            </div>
            <span
              className="font-display text-lg font-medium"
              style={{ color: style.color }}
            >
              {isEmptyState ? 'No exposure data' : data.posture}
            </span>
          </div>
        </div>

        {!isEmptyState && (
          <div className="text-right">
            <div
              className="text-[10px] mb-0.5"
              style={{ color: M.textMuted, letterSpacing: '0.03em' }}
            >
              Misalignment
            </div>
            <div className="font-display text-xl font-medium" style={{ color: M.text }}>
              {data.misalignment}
              <span className="text-xs font-normal" style={{ color: M.textMuted }}>%</span>
            </div>
          </div>
        )}
      </div>

      {isEmptyState ? (
        <div
          className="text-center text-[12px] py-3 rounded-2xl"
          style={{ color: M.textMuted, background: 'rgba(255,255,255,0.4)' }}
        >
          Add holdings to see allocation breakdown
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.allocations.map((a) => (
            <AllocationBar key={a.asset} allocation={a} />
          ))}
        </div>
      )}
    </div>
  )
}
