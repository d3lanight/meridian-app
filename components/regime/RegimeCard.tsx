// ━━━ Regime Card (Hero) ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Top card showing current market regime with confidence arc

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
      className="relative overflow-hidden rounded-2xl p-6 mb-3"
      style={{
        background: `linear-gradient(135deg, ${M.surfaceElevated} 0%, ${M.surface} 100%)`,
        border: `1px solid ${M.border}`,
      }}
    >
      {/* Background glow */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: '-40px',
          right: '-40px',
          width: '160px',
          height: '160px',
          background: `radial-gradient(circle, ${M.accentGlow}, transparent 70%)`,
        }}
      />

      <div className="relative">
        {/* Top row: regime info + arc */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div
              className="text-[10px] font-semibold font-body mb-2"
              style={{ letterSpacing: '0.1em', color: M.textMuted }}
            >
              CURRENT REGIME
            </div>
            <div
              className="font-display text-[28px] font-semibold leading-tight mb-2"
              style={{ color: M.positive, letterSpacing: '-0.03em' }}
            >
              {data.current}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: M.textMuted }}>
              <span className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: M.positive }}
                />
                {data.persistence} days
              </span>
              <span style={{ color: M.textSubtle }}>·</span>
              <span>{data.trend} (7d)</span>
            </div>
          </div>

          <ConfidenceArc value={data.confidence} size={100} />
        </div>

        {/* Quick metrics row */}
        <div
          className="flex gap-2 mt-4 pt-4"
          style={{ borderTop: `1px solid ${M.borderSubtle}` }}
        >
          {quickMetrics.map((m) => (
            <div
              key={m.label}
              className="flex-1 rounded-[10px] p-2.5 text-center"
              style={{ background: M.surfaceLight }}
            >
              <div
                className="text-[10px] mb-1"
                style={{ color: M.textSubtle, letterSpacing: '0.03em' }}
              >
                {m.label}
              </div>
              <div
                className="font-display text-sm font-semibold"
                style={{
                  color:
                    m.positive === true
                      ? M.positive
                      : m.positive === false
                        ? M.negative
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

