import { M } from '@/lib/meridian'

interface SectionHeaderProps {
  label: string
}

export function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: M.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        padding: '0 4px',
        marginBottom: 8,
      }}
    >
      {label}
    </div>
  )
}
