// ━━━ Allocation Bar ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Single horizontal bar showing current vs target allocation

import { M } from '@/lib/meridian';
import type { Allocation } from '@/types';

interface AllocationBarProps {
  allocation: Allocation;
}

export default function AllocationBar({ allocation }: AllocationBarProps) {
  const { asset, current, target } = allocation;
  const diff = current - target;
  const hasDiff = Math.abs(diff) > 2;

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
        {/* Filled bar */}
        <div
          className="h-full rounded-full transition-[width] duration-[800ms] ease-out"
          style={{
            width: `${current}%`,
            background: hasDiff
              ? `linear-gradient(90deg, ${M.accent}88, ${M.accent})`
              : `linear-gradient(90deg, ${M.positive}66, ${M.positive})`,
          }}
        />

        {/* Target marker (only shown when misaligned) */}
        {hasDiff && (
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

      <span
        className="w-8 text-[11px] font-mono font-medium text-right"
        style={{ color: hasDiff ? M.accent : M.textMuted }}
      >
        {current}%
      </span>
    </div>
  );
}

