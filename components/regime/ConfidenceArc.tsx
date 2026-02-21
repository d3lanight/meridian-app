// ━━━ Confidence Arc ━━━
// v0.5.0 · ca-story66 · 2026-02-21
// Meridian v2: teal→accent gradient, warm text

import { M } from '@/lib/meridian';

interface ConfidenceArcProps {
  value?: number;
  size?: number;
}

export default function ConfidenceArc({ value = 87, size = 100 }: ConfidenceArcProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const startAngle = 135;
  const totalAngle = 270;
  const filledAngle = (value / 100) * totalAngle;
  const dashOffset = circumference - (filledAngle / 360) * circumference;
  const trackDash = (totalAngle / 360) * circumference;

  const gradientId = `arcGrad-${size}`;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-label={`Confidence: ${value}%`} role="img">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={M.positive} />
            <stop offset="100%" stopColor={M.accent} />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={M.surfaceLight}
          strokeWidth={strokeWidth}
          strokeDasharray={`${trackDash} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
        />

        {/* Filled arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${trackDash} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span
          className="font-display text-[32px] font-medium leading-none tracking-tight"
          style={{ color: M.text, letterSpacing: '-0.03em' }}
        >
          {value}
        </span>
        <span
          className="text-[10px] font-medium mt-0.5"
          style={{ color: M.textMuted, letterSpacing: '0.06em' }}
        >
          CONFIDENCE
        </span>
      </div>
    </div>
  );
}
