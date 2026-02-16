/**
 * ComplexityDots Component
 * Version: 1.0
 * Story: ca-story31-sprint-dashboard
 * 
 * Visual complexity indicator (1-3 dots)
 */

interface ComplexityDotsProps {
  level: 'low' | 'medium' | 'high'
  showLabel?: boolean
}

const dotCount = {
  low: 1,
  medium: 2,
  high: 3,
}

export function ComplexityDots({ level, showLabel = true }: ComplexityDotsProps) {
  const count = dotCount[level]

  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < count ? 'bg-[#F5B74D]' : 'bg-[#64748B]'
            }`}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-sm text-[#94A3B8] capitalize">{level}</span>
      )}
    </div>
  )
}