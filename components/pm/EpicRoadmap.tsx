/**
 * EpicRoadmap Component
 * Version: 1.0
 * Story: ca-story29-pm-dashboard
 * 
 * 3-column epic grid with status and story counts
 */

'use client'

import Link from 'next/link'
import { CheckCircle2, Clock, Circle } from 'lucide-react'

interface Epic {
  id: string
  name: string
  slug: string
  epicNumber: number
  status: 'done' | 'in-progress' | 'planned'
  storyCount: number
  doneCount: number
}

interface EpicRoadmapProps {
  epics: Epic[]
}

export function EpicRoadmap({ epics }: EpicRoadmapProps) {
  return (
    <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-6">
      <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">
        Epic Roadmap
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {epics.map((epic) => {
          const progressPercent = epic.storyCount > 0
            ? Math.round((epic.doneCount / epic.storyCount) * 100)
            : 0

          const StatusIcon =
            epic.status === 'done'
              ? CheckCircle2
              : epic.status === 'in-progress'
              ? Clock
              : Circle

          const statusColor =
            epic.status === 'done'
              ? 'text-[#34D399]'
              : epic.status === 'in-progress'
              ? 'text-[#F5B74D]'
              : 'text-[#64748B]'

          return (
            <Link key={epic.id} href={`/admin/collections/epics/${epic.id}`} className="block">
              <div className="bg-[#0B1120] border border-[#1E293B] rounded-lg p-4 hover:border-[#A78BFA]/30 transition-all group">
                {/* Epic Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#A78BFA] text-white">
                    E{epic.epicNumber}
                  </span>
                  <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                </div>

                {/* Epic Name */}
                <h3 className="text-sm font-medium text-[#F1F5F9] mb-3 line-clamp-2 group-hover:text-[#A78BFA] transition-colors">
                  {epic.name}
                </h3>

                {/* Story Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B]">Stories</span>
                    <span className="text-[#94A3B8]">
                      {epic.doneCount}/{epic.storyCount}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#131B2E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#A78BFA] rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {epics.length === 0 && (
        <div className="text-center py-8 text-sm text-[#64748B]">
          No epics found
        </div>
      )}
    </div>
  )
}
