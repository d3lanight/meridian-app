// ━━━ Regime Card (Hero) ━━━
// v0.5.0 · ca-story66 · 2026-02-21
// Meridian v2: glassmorphic, 24px radius, medium weight

import { M } from '@/lib/meridian';
import type { RegimeData } from '@/types';
import ConfidenceArc from './ConfidenceArc';

interface RegimeCardProps {
  data: RegimeData;
}

export default function RegimeCard({ data }: RegimeCardProps) {
  const quickMetrics = [
    { label: 'Trend', value: data.trend, positive: true },
    { label: 'Volume', value: data.volume, positive: true },
    { label: 'Volatility', value: data.volatility, positive: null },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 mb-3"
      style={{
        background: 'linear-gradient(135deg, rgba(42,157,143,0.1), rgba(42,157,143,0.05))',
        backdropFilter: M.surfaceBlur,
        WebkitBackdropFilter: M.surfaceBlur,
        border: `1px solid ${M.borderPositive}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div
              className="text-[10px] font-semibold font-body mb-2"
              style={{ letterSpacing: '0.1em', color: M.textMuted }}
            >
              CURRENT REGIME
            </div>
            <div
              className="font-display text-[28px] font-medium leading-tight mb-2"
              style={{ color: M.positive, letterSpacing: '-0.03em' }}
            >
              {data.current}
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: M.textMuted }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: M.positive }} />
              <span>{data.persistence} days</span>
            </div>
          </div>
          <ConfidenceArc value={data.confidence} size={100} />
        </div>

        <div
          className="flex gap-2 mt-4 pt-4"
          style={{ borderTop: `1px solid ${M.borderSubtle}` }}
        >
          {quickMetrics.map((m) => (
            <div
              key={m.label}
              className="flex-1 rounded-2xl p-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.4)' }}
            >
              <div className="text-[10px] mb-1" style={{ color: M.textMuted, letterSpacing: '0.03em' }}>
                {m.label}
              </div>
              <div
                className="font-display text-sm font-semibold"
                style={{
                  color: m.positive === true ? M.positive
                    : m.positive === false ? M.negative
                    : M.textSecondary,
                }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
