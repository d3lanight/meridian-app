/**
 * ActiveEpicSection Component
 * Version: 1.0
 * Story: ca-story29-pm-dashboard
 * 
 * Collapsible active epic with story breakdown
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import Link from 'next/link'

interface Story {
  id: string
  name: string
  slug: string
  status: 'done' | 'in-progress' | 'sprint-ready' | 'needs-refinement' | 'deferred'
}

interface ActiveEpicSectionProps {
  epicName: string
  epicNumber: number
  stories: Story[]
}

export function ActiveEpicSection({ epicName, epicNumber, stories }: ActiveEpicSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const doneStories = stories.filter(s => s.status === 'done').length
  const totalStories = stories.length

  return (
    <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#0B1120]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-[#94A3B8]" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[#94A3B8]" />
          )}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#A78BFA] text-white">
              E{epicNumber}
            </span>
            <span className="text-sm font-semibold text-[#F1F5F9]">{epicName}</span>
          </div>
        </div>
        <span className="text-xs text-[#64748B]">
          {doneStories}/{totalStories} complete
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-4 space-y-4">
          <ProgressBar value={doneStories} total={totalStories} showLabel={false} />

          {/* Story List */}
          <div className="space-y-2">
            {stories.map((story) => {
              const storyNumber = story.slug.match(/ca-story(\d+)/)?.[1] || '?'
              return (
                <Link
                  key={story.id}
                  href={`/admin/pm/stories/${story.slug}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#0B1120] hover:bg-[#0B1120]/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#64748B]">#{storyNumber}</span>
                      <span className="text-sm text-[#F1F5F9]">{story.name}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        story.status === 'done'
                          ? 'bg-[#34D399]/10 text-[#34D399]'
                          : story.status === 'in-progress'
                          ? 'bg-[#F5B74D]/10 text-[#F5B74D]'
                          : story.status === 'sprint-ready'
                          ? 'bg-[#60A5FA]/10 text-[#60A5FA]'
                          : story.status === 'deferred'
                          ? 'bg-[#F87171]/10 text-[#F87171]'
                          : 'bg-[#A78BFA]/10 text-[#A78BFA]'
                      }`}
                    >
                      {story.status.replace('-', ' ')}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
