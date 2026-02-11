// ━━━ Portfolio Posture Card ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Alignment status + allocation bar breakdown

import { CheckCircle } from 'lucide-react';
import { M } from '@/lib/meridian';
import type { PortfolioData } from '@/types';
import AllocationBar from './AllocationBar';

interface PostureCardProps {
  data: PortfolioData;
}

export default function PostureCard({ data }: PostureCardProps) {
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
              style={{ background: M.positiveDim }}
            >
              <CheckCircle size={14} color={M.positive} />
            </div>
            <span
              className="font-display text-lg font-semibold"
              style={{ color: M.positive }}
            >
              {data.posture}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div
            className="text-[10px] mb-0.5"
            style={{ color: M.textSubtle, letterSpacing: '0.03em' }}
          >
            Misalignment
          </div>
          <div className="font-display text-xl font-semibold" style={{ color: M.text }}>
            {data.misalignment}
            <span className="text-xs font-normal" style={{ color: M.textMuted }}>
              %
            </span>
          </div>
        </div>
      </div>

      {/* Allocation bars */}
      <div className="flex flex-col gap-2">
        {data.allocations.map((a) => (
          <AllocationBar key={a.asset} allocation={a} />
        ))}
      </div>
    </div>
  );
}

