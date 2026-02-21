// ━━━ Allocation Bar ━━━
// v0.5.0 · ca-story66 · 2026-02-21
// Meridian v2: warm track color, accent/teal fills

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
        className="relative flex-1 h-2 rounded-full overflow-hidden"
        style={{ background: M.surfaceLight }}
      >
        {!isEmpty && (
          <div
            className="h-full rounded-full transition-[width] duration-[800ms] ease-out"
            style={{
              width: `${current}%`,
              background: hasDiff
                ? 'linear-gradient(90deg, #F4A261, #E76F51)'
                : `linear-gradient(90deg, ${M.positive}, rgba(42,157,143,0.8))`,
            }}
          />
        )}

        {hasDiff && !isEmpty && (
          <div
            className="absolute rounded-sm"
            style={{
              top: '-1px',
              left: `${target}%`,
              width: '2px',
              height: '10px',
              background: M.textMuted,
              transform: 'translateX(-1px)',
            }}
          />
        )}
      </div>

      <span
        className="w-8 text-[11px] font-mono font-medium text-right"
        style={{ color: isEmpty ? M.textMuted : hasDiff ? M.accent : M.textMuted }}
      >
        {current}%
      </span>
    </div>
  )
}
