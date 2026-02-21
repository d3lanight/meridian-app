// ━━━ Signal Card ━━━
// v0.5.0 · ca-story66 · 2026-02-21
// Meridian v2: glassmorphic, 24px radius, warm severity colors

'use client';

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, ChevronDown } from 'lucide-react';
import { M } from '@/lib/meridian';
import type { Signal, SignalAction } from '@/types';

function getActionStyle(action: SignalAction) {
  if (action === 'BUY') return { bg: M.positiveDim, color: M.positive, Icon: ArrowUpRight };
  if (action === 'SELL') return { bg: M.negativeDim, color: M.negative, Icon: ArrowDownRight };
  return { bg: M.neutralDim, color: M.neutral, Icon: Minus };
}

function SeverityIndicator({ severity }: { severity: number }) {
  const color = severity >= 70 ? M.negative : severity >= 50 ? M.accent : M.positive;
  const bgColor = severity >= 70 ? M.negativeDim : severity >= 50 ? M.accentMuted : M.positiveDim;

  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center font-display text-xs font-semibold flex-shrink-0"
      style={{ background: bgColor, color }}
    >
      {severity}
    </div>
  );
}

interface SignalCardProps {
  signal: Signal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = getActionStyle(signal.action);
  const ActionIcon = style.Icon;
  const isHigh = signal.severity >= 70;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left relative overflow-hidden rounded-3xl transition-colors duration-200"
      style={{
        background: isHigh
          ? 'rgba(231,111,81,0.05)'
          : M.surface,
        backdropFilter: M.surfaceBlur,
        WebkitBackdropFilter: M.surfaceBlur,
        border: `1px solid ${isHigh ? 'rgba(231,111,81,0.2)' : M.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
      aria-expanded={expanded}
    >
      {isHigh && (
        <div
          className="absolute left-0 rounded-r-sm"
          style={{
            top: '20%',
            bottom: '20%',
            width: '3px',
            background: M.negative,
          }}
        />
      )}

      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: style.bg }}
        >
          <ActionIcon size={18} color={style.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="font-display text-[15px] font-medium"
              style={{ letterSpacing: '-0.01em', color: M.text }}
            >
              {signal.asset}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                background: style.bg,
                color: style.color,
                letterSpacing: '0.04em',
              }}
            >
              {signal.action}
            </span>
          </div>
          <div className="text-xs truncate" style={{ color: M.textMuted }}>
            {signal.reason}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SeverityIndicator severity={signal.severity} />
          <ChevronDown
            size={14}
            color={M.textMuted}
            className="transition-transform duration-200 flex-shrink-0"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </div>

      {expanded && (
        <div
          className="px-4 pb-3.5 pt-0"
          style={{ borderTop: `1px solid ${M.borderSubtle}` }}
        >
          <div className="pt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span style={{ color: M.textMuted }}>Severity</span>
              <div className="font-display font-medium mt-0.5" style={{ color: M.text }}>
                {signal.severity}/100
              </div>
            </div>
            <div>
              <span style={{ color: M.textMuted }}>Generated</span>
              <div className="font-display font-medium mt-0.5" style={{ color: M.text }}>
                {signal.time}
              </div>
            </div>
            <div className="col-span-2">
              <span style={{ color: M.textMuted }}>Reasoning</span>
              <div className="mt-0.5" style={{ color: M.textSecondary }}>
                {signal.reason}
              </div>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}
