'use client'

/**
 * PMNav Component
 * Version: 1.0
 * Story: ca-story31-sprint-dashboard
 * 
 * 3-tab navigation for PM dashboards
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Sprint Dashboard', href: '/admin/pm/sprint' },
  { label: 'Story Board', href: '/admin/pm/stories' },
  { label: 'Sprint Goals', href: '/admin/pm/goals' },
]

export function PMNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-[#1E293B]">
      <div className="flex gap-8">
        {tabs.map((tab) => {
          const isActive = pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-4 pt-1 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-[#F5B74D] text-[#F5B74D]'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
