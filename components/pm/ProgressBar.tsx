/**
 * ProgressBar Component
 * Version: 1.0
 * Story: ca-story31-sprint-dashboard
 * 
 * Horizontal progress bar with segments or percentage
 */

interface ProgressBarProps {
  value: number
  total: number
  showLabel?: boolean
}

export function ProgressBar({ value, total, showLabel = true }: ProgressBarProps) {
  const percentage = Math.round((value / total) * 100)

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-[#94A3B8]">Progress</span>
          <span className="text-[#F1F5F9] font-medium">{value} / {total}</span>
        </div>
      )}
      <div className="h-2 bg-[#131B2E] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#F5B74D] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
