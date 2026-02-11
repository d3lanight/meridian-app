// ━━━ Market Pulse Card ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// 2×2 grid of market health metrics

import { M } from '@/lib/meridian';

interface PulseMetric {
  label: string;
  value: string | number;
  sub: string | null;
  color: string;
}

interface MarketPulseCardProps {
  metrics: PulseMetric[];
}

export default function MarketPulseCard({ metrics }: MarketPulseCardProps) {
  return (
    <div
      className="rounded-2xl p-5 mb-3"
      style={{
        background: M.surface,
        border: `1px solid ${M.borderSubtle}`,
      }}
    >
      <div
        className="text-[10px] font-semibold font-body mb-3.5"
        style={{ letterSpacing: '0.1em', color: M.textMuted }}
      >
        MARKET PULSE
      </div>

      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-3.5"
            style={{ background: M.surfaceLight }}
          >
            <div
              className="text-[10px] font-medium mb-1.5"
              style={{ color: M.textSubtle, letterSpacing: '0.03em' }}
            >
              {m.label}
            </div>
            <div
              className="font-display text-xl font-semibold leading-tight"
              style={{ color: m.color, letterSpacing: '-0.02em' }}
            >
              {m.value}
            </div>
            {m.sub && (
              <div className="text-[11px] mt-0.5" style={{ color: M.textMuted }}>
                {m.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

