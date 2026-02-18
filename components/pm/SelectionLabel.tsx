/**
 * SectionLabel — Shared PM section header label
 * Version: 1.0
 * Story: ca-story41-pm-dashboard-coherence
 *
 * Consistent uppercase label used above each dashboard section.
 * Matches prototype SectionLabel pattern (line 127).
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