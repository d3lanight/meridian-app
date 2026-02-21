// ━━━ Market Pulse Card ━━━
// v0.5.0 · ca-story66 · 2026-02-21
// Meridian v2: glassmorphic, 24px radius, warm sub-cards

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
      className="rounded-3xl p-5 mb-3"
      style={{
        background: M.surface,
        backdropFilter: M.surfaceBlur,
        WebkitBackdropFilter: M.surfaceBlur,
        border: `1px solid ${M.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
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
            className="rounded-2xl p-3.5"
            style={{ background: 'rgba(255,255,255,0.4)' }}
          >
            <div
              className="text-[10px] font-medium mb-1.5"
              style={{ color: M.textMuted, letterSpacing: '0.03em' }}
            >
              {m.label}
            </div>
            <div
              className="font-display text-xl font-medium leading-tight"
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
