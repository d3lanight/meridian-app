/**
 * MetricCard Component
 * Version: 1.0
 * Story: ca-story31-sprint-dashboard
 * 
 * KPI cards for sprint dashboard metrics
 */

interface MetricCardProps {
  label: string
  value: string | number
  subtitle?: string
  color: 'accent' | 'positive' | 'blue' | 'purple'
  delay?: number
}

const colorConfig = {
  accent: 'border-[#F5B74D]/20 bg-[#F5B74D]/5',
  positive: 'border-[#34D399]/20 bg-[#34D399]/5',
  blue: 'border-[#60A5FA]/20 bg-[#60A5FA]/5',
  purple: 'border-[#A78BFA]/20 bg-[#A78BFA]/5',
}

export function MetricCard({ label, value, subtitle, color, delay = 0 }: MetricCardProps) {
  return (
    <div
      className={`rounded-lg border p-6 ${colorConfig[color]} animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-sm text-[#94A3B8] font-medium mb-2">{label}</div>
      <div className="text-3xl font-bold text-[#F1F5F9] mb-1">{value}</div>
      {subtitle && (
        <div className="text-sm text-[#64748B]">{subtitle}</div>
      )}
    </div>
  )
}
