/**
 * MetricStrip Component
 * Version: 1.0
 * Story: ca-story29-pm-dashboard
 * 
 * Compact 4-cell metric strip
 */

'use client'

interface Metric {
  label: string
  value: string | number
  color: 'accent' | 'positive' | 'blue' | 'purple'
}

interface MetricStripProps {
  metrics: Metric[]
}

const colorConfig = {
  accent: 'border-l-[#F5B74D]',
  positive: 'border-l-[#34D399]',
  blue: 'border-l-[#60A5FA]',
  purple: 'border-l-[#A78BFA]',
}

export function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <div
          key={i}
          className={`bg-[#131B2E] border border-[#1E293B] border-l-2 ${colorConfig[metric.color]} rounded-lg p-4`}
        >
          <div className="text-xs text-[#64748B] mb-1">{metric.label}</div>
          <div className="text-2xl font-bold text-[#F1F5F9]">{metric.value}</div>
        </div>
      ))}
    </div>
  )
}
