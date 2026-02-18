/**
 * SectionLabel — Shared PM section header label
 * Version: 1.0
 * Story: ca-story41-pm-dashboard-coherence
 */

export function SectionLabel({
  children,
  color = '#F5B74D',
}: {
  children: React.ReactNode
  color?: string
}) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{ color }}
    >
      {children}
    </span>
  )
}
