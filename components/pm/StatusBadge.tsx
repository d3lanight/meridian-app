import { CheckCircle2, Clock, Circle, XCircle, BookOpen, Zap } from 'lucide-react'

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  'done':             { color: '#34D399', bg: 'rgba(52,211,153,0.12)',  label: 'Done',             icon: CheckCircle2 },
  'in-progress':      { color: '#F5B74D', bg: 'rgba(245,183,77,0.12)', label: 'In Progress',      icon: Clock },
  'sprint-ready':     { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', label: 'Sprint Ready',     icon: Zap },
  'needs-refinement': { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', label: 'Needs Refinement', icon: BookOpen },
  'deferred':         { color: '#F87171', bg: 'rgba(248,113,113,0.12)', label: 'Deferred',         icon: XCircle },
  'cancelled':        { color: '#64748B', bg: 'rgba(100,116,139,0.12)', label: 'Cancelled',        icon: XCircle },
}

const sprintStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  'active':    { color: '#F5B74D', bg: 'rgba(245,183,77,0.12)', label: 'Active' },
  'completed': { color: '#34D399', bg: 'rgba(52,211,153,0.12)', label: 'Completed' },
  'paused':    { color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', label: 'Paused' },
}

const epicStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  'complete':       { color: '#34D399', bg: 'rgba(52,211,153,0.12)', label: 'Complete' },
  'active':         { color: '#F5B74D', bg: 'rgba(245,183,77,0.12)', label: 'Active' },
  'planned':        { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', label: 'Planned' },
  'in-refinement':  { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', label: 'In Refinement' },
}

const phaseStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  'complete': { color: '#34D399', bg: 'rgba(52,211,153,0.12)', label: 'Complete' },
  'active':   { color: '#F5B74D', bg: 'rgba(245,183,77,0.12)', label: 'Active' },
  'planned':  { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', label: 'Planned' },
}

export function StatusBadge({ status, size = 'default' }: { status: string; size?: 'default' | 'small' }) {
  const cfg = statusConfig[status]
  if (!cfg) return null
  const Icon = cfg.icon
  const sm = size === 'small'
  return (
    <span
      className="inline-flex items-center whitespace-nowrap"
      style={{
        gap: sm ? 4 : 5,
        padding: sm ? '2px 8px' : '3px 10px',
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.color,
        fontSize: sm ? 10 : 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {Icon && <Icon size={sm ? 10 : 12} />}
      {cfg.label}
    </span>
  )
}

export function SprintBadge({ status }: { status: string }) {
  const cfg = sprintStatusConfig[status]
  if (!cfg) return null
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 5, padding: '3px 10px', borderRadius: 20,
        background: cfg.bg, color: cfg.color,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
      }}
    >
      {cfg.label}
    </span>
  )
}

export function EpicBadge({ status }: { status: string }) {
  const cfg = epicStatusConfig[status]
  if (!cfg) return null
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 5, padding: '3px 10px', borderRadius: 20,
        background: cfg.bg, color: cfg.color,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
      }}
    >
      {cfg.label}
    </span>
  )
}

export function PhaseBadge({ status }: { status: string }) {
  const cfg = phaseStatusConfig[status]
  if (!cfg) return null
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 5, padding: '3px 10px', borderRadius: 20,
        background: cfg.bg, color: cfg.color,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
      }}
    >
      {cfg.label}
    </span>
  )
}

export { statusConfig, sprintStatusConfig, epicStatusConfig, phaseStatusConfig }
