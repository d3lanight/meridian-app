'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Layers, KanbanSquare, GitBranch } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/admin/pm',         icon: LayoutDashboard },
  { label: 'Sprint',    href: '/admin/pm/sprint',   icon: Layers },
  { label: 'Stories',   href: '/admin/pm/stories',  icon: KanbanSquare },
  { label: 'Roadmap',   href: '/admin/pm/roadmap',  icon: GitBranch },
]

export function PMNav() {
  const pathname = usePathname()

  return (
    <nav
      className="sticky top-0 z-20 flex items-center border-b"
      style={{
        background: 'rgba(11,17,32,0.95)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(148,163,184,0.08)',
        height: 48,
        paddingLeft: 28, paddingRight: 28,
      }}
    >
      {navItems.map(item => {
        const isActive =
          item.href === '/admin/pm'
            ? pathname === '/admin/pm'
            : pathname?.startsWith(item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center no-underline transition-colors"
            style={{
              gap: 7,
              padding: '0 16px',
              height: '100%',
              borderBottom: `2px solid ${isActive ? '#F5B74D' : 'transparent'}`,
              color: isActive ? '#F5B74D' : '#64748B',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: -1,
            }}
          >
            <Icon size={15} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
