// ━━━ Portfolio Posture Card ━━━
// v0.4.1 · ca-story38 · 2026-02-17
// Alignment status + allocation bar breakdown
// Changelog (from v0.4.0):
//  - "No Data" posture renders neutral (Inbox icon, muted text) not green CheckCircle
//  - Empty state shows helper text instead of empty bars
//  - Misalignment column hidden when no data

'use client'

import { CheckCircle, AlertTriangle, Inbox } from 'lucide-react'
import { M } from '@/lib/meridian'
import type { PortfolioData } from '@/types'
import AllocationBar from './AllocationBar'

interface PostureCardProps {
  data: PortfolioData
}

// Posture → visual style mapping
function getPostureStyle(posture: string) {
  switch (posture) {
    case 'Aligned':
      return { icon: CheckCircle, color: M.positive, bg: M.positiveDim }
    case 'Watch':
      return { icon: AlertTriangle, color: M.accent, bg: M.accentMuted }
    case 'Misaligned':
      return { icon: AlertTriangle, color: M.negative, bg: M.negativeDim }
    default: // "No Data", "Unknown"
      return { icon: Inbox, color: M.textMuted, bg: M.neutralDim }
  }
}

export default function PostureCard({ data }: PostureCardProps) {
  const isEmptyState = data.posture === 'No Data'
  const style = getPostureStyle(data.posture)
  const Icon = style.icon

  return (
    <div
      className="rounded-2xl p-5 mb-3"
      style={{
        background: M.surface,
        border: `1px solid ${M.borderSubtle}`,
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
              className="w-6 h-6 rounded-[7px] flex items-center justify-center"
              style={{ background: style.bg }}
            >
              <Icon size={14} color={style.color} />
            </div>
            <span
              className="font-display text-lg font-semibold"
              style={{ color: style.color }}
            >
              {isEmptyState ? 'No exposure data' : data.posture}
            </span>
          </div>
        </div>

        {/* Misalignment — only shown with real data */}
        {!isEmptyState && (
          <div className="text-right">
            <div
              className="text-[10px] mb-0.5"
              style={{ color: M.textSubtle, letterSpacing: '0.03em' }}
            >
              Misalignment
            </div>
            <div className="font-display text-xl font-semibold" style={{ color: M.text }}>
              {data.misalignment}
              <span className="text-xs font-normal" style={{ color: M.textMuted }}>%</span>
            </div>
          </div>
        )}
      </div>

      {/* Empty state message OR allocation bars */}
      {isEmptyState ? (
        <div
          className="text-center text-[12px] py-3 rounded-xl"
          style={{ color: M.textMuted, background: M.surfaceLight }}
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
