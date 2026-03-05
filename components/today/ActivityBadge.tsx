// ━━━ ActivityBadge ━━━ v1.0.0 · S161
'use client'
import { Bell } from 'lucide-react'
import { M } from '@/lib/meridian'

interface ActivityBadgeProps {
  count: number
}

export default function ActivityBadge({ count }: ActivityBadgeProps) {
  return (
    <div style={{
      position: 'relative', width: 38, height: 38, borderRadius: '50%',
      background: 'rgba(255,255,255,0.5)',
      border: `1px solid ${M.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
    }}>
      <Bell size={16} color={M.textSecondary} />
      {count > 0 && (
        <div style={{
          position: 'absolute', top: 4, right: 4,
          width: 8, height: 8, borderRadius: '50%',
          background: M.accent, border: '1.5px solid white',
        }} />
      )}
    </div>
  )
}
