// ━━━ Allocation Bar ━━━
// v0.4.1 · ca-story38 · 2026-02-17
// Single horizontal bar showing current vs target allocation
// Changelog (from v0.4.0):
//  - 0% bars skip fill render (no false accent signal)
//  - 0% percentage text uses textSubtle instead of accent

import { M } from '@/lib/meridian'

interface AllocationBarProps {
  allocation: {
    asset: string
    current: number
    target: number
  }
}

export default function AllocationBar({ allocation }: AllocationBarProps) {
  const { asset, current, target } = allocation
  const diff = current - target
  const hasDiff = Math.abs(diff) > 2
  const isEmpty = current === 0 && target === 0

  return (
    <div className="flex items-center gap-2.5">
      <span
        className="w-[42px] text-[11px] font-mono font-medium"
        style={{ color: M.textSecondary }}
      >
        {asset}
      </span>

      <div
        className="relative flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: M.surfaceLight }}
      >
        {/* Filled bar — skip when empty */}
        {!isEmpty && (
          <div
            className="h-full rounded-full transition-[width] duration-[800ms] ease-out"
            style={{
              width: `${current}%`,
              background: hasDiff
                ? `linear-gradient(90deg, ${M.accent}88, ${M.accent})`
                : `linear-gradient(90deg, ${M.positive}66, ${M.positive})`,
            }}
          />
        )}

        {/* Target marker — only when misaligned and has data */}
        {hasDiff && !isEmpty && (
          <div
            className="absolute rounded-sm"
            style={{
              top: '-1px',
              left: `${target}%`,
              width: '2px',
              height: '8px',
              background: M.textMuted,
              transform: 'translateX(-1px)',
            }}
          />
        )}
      </div>

      {/* Percentage — muted when empty */}
      <span
        className="w-8 text-[11px] font-mono font-medium text-right"
        style={{ color: isEmpty ? M.textSubtle : hasDiff ? M.accent : M.textMuted }}
      >
        {current}%
      </span>
    </div>
  )
}
