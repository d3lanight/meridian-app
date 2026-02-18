/**
 * MetricStrip Component
 * Version: 2.0
 * Story: ca-story41-pm-dashboard-coherence
 *
 * Compact 4-cell continuous strip with gap-1 divider pattern.
 * Matches pm-dashboard-b-v2.jsx lines 383–406.
 */

'use client'

interface Metric {
  label: string
  value: string
  sub?: string
  color: 'positive' | 'accent' | 'blue' | 'purple'
}

interface MetricStripProps {
  metrics: Metric[]
}

const colorMap: Record<string, string> = {
  positive: '#34D399',
  accent: '#F5B74D',
  blue: '#60A5FA',
  purple: '#A78BFA',
}

export function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <div
      className="flex gap-[1px] mx-[28px] my-[20px] rounded-[14px] overflow-hidden"
      style={{ background: 'rgba(148,163,184,0.08)' }}
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex-1 bg-[#131B2E] py-[14px] px-[16px] text-center"
        >
          <div className="text-[9px] uppercase tracking-[0.08em] text-[#64748B] font-semibold mb-[6px]">
            {metric.label}
          </div>
          <div
            className="font-mono text-[20px] font-bold"
            style={{ color: colorMap[metric.color] }}
          >
            {metric.value}
          </div>
          {metric.sub && (
            <div className="text-[10px] text-[#475569] mt-[2px]">
              {metric.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
