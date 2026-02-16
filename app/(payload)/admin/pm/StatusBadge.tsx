/**
 * StatusBadge Component
 * Version: 1.0
 * Story: ca-story31-sprint-dashboard
 * 
 * Renders status chips with Meridian colors and icons
 */

import { CheckCircle2, Clock, Zap, BookOpen, XCircle } from 'lucide-react'

type Status = 'done' | 'in-progress' | 'sprint-ready' | 'needs-refinement' | 'deferred'

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md'
}

const statusConfig = {
  'done': {
    label: 'Done',
    color: 'text-[#34D399] bg-[#34D399]/10',
    icon: CheckCircle2,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-[#F5B74D] bg-[#F5B74D]/10',
    icon: Clock,
  },
  'sprint-ready': {
    label: 'Sprint Ready',
    color: 'text-[#60A5FA] bg-[#60A5FA]/10',
    icon: Zap,
  },
  'needs-refinement': {
    label: 'Needs Refinement',
    color: 'text-[#A78BFA] bg-[#A78BFA]/10',
    icon: BookOpen,
  },
  'deferred': {
    label: 'Deferred',
    color: 'text-[#F87171] bg-[#F87171]/10',
    icon: XCircle,
  },
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-sm px-3 py-1 gap-1.5'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </span>
  )
}