/**
 * PMNav Component
 * Version: 2.0
 * Story: ca-story41-pm-dashboard-coherence
 *
 * Sticky top nav with icons, backdrop blur, accent underline.
 * Matches pm-dashboard-b-v2.jsx lines 772–799.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, KanbanSquare, Flag, Target } from 'lucide-react'

const tabs = [
  { label: 'PM Dashboard', href: '/admin/pm', icon: LayoutDashboard },
  { label: 'Sprint Dashboard', href: '/admin/pm/sprint', icon: KanbanSquare },
  { label: 'Story Board', href: '/admin/pm/stories', icon: Flag },
  { label: 'Sprint Goals', href: '/admin/pm/goals', icon: Target },
]

export function PMNav() {
  const pathname = usePathname()

  return (
    <nav
      className="sticky top-0 z-20 border-b border-[rgba(148,163,184,0.08)] px-[28px] flex items-center h-[48px]"
      style={{
        background: 'rgba(11,17,32,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.href === '/admin/pm'
          ? pathname === '/admin/pm'
          : pathname?.startsWith(tab.href)
        const Icon = tab.icon

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-[7px] px-[16px] h-full text-[13px] font-body border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-[#F5B74D] text-[#F5B74D] font-semibold'
                : 'border-transparent text-[#64748B] font-medium hover:text-[#94A3B8]'
            }`}
          >
            <Icon size={15} />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
