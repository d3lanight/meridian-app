/**
 * PM Dashboard Shared Layout
 * Version: 1.0
 * Story: ca-story41-pm-dashboard-coherence
 *
 * Wraps all /admin/pm/* pages with shared PMNav.
 * Individual pages no longer render their own PMNav.
 */

import { PMNav } from '@/components/pm/PMNav'

export default function PMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F1F5F9]">
      <PMNav />
      {children}
    </div>
  )
}
