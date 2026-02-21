// ━━━ Meridian Logo Mark ━━━
// v0.5.0 · ca-story66 · 2026-02-21
// Meridian v2: warm accent color default

import { M } from '@/lib/meridian';

interface MeridianMarkProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export default function MeridianMark({
  size = 48,
  color = M.accent,
  opacity = 1,
}: MeridianMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{ opacity }}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="1.5" opacity="0.25" />
      <circle cx="24" cy="24" r="13" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <line x1="24" y1="2" x2="24" y2="46" stroke={color} strokeWidth="1.5" />
      <line x1="12" y1="6" x2="36" y2="42" stroke={color} strokeWidth="1" opacity="0.35" />
      <circle cx="24" cy="24" r="3" fill={color} />
      <circle cx="24" cy="10" r="1.5" fill={color} opacity="0.5" />
      <circle cx="24" cy="38" r="1.5" fill={color} opacity="0.5" />
    </svg>
  );
}
