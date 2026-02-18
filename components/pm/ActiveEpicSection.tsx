/**
 * ActiveEpicSection Component
 * Version: 2.0
 * Story: ca-story41-pm-dashboard-coherence
 *
 * Collapsible active epic with 2-column story cards, status sections.
 * Matches pm-dashboard-b-v2.jsx lines 408–546.
 */

'use client'

import { useState } from 'react'
import { ChevronDown, CheckCircle2, XCircle, Clock, Zap, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { SectionLabel } from '@/components/pm/SectionLabel'

interface Story {
  id: string
  name: string
  slug: string
  status: 'done' | 'in-progress' | 'sprint-ready' | 'needs-refinement' | 'deferred'
  sprint?: string
  effort?: string
}

interface ActiveEpicSectionProps {
  epicName: string
  epicNumber: number
  stories: Story[]
}

const statusConfig: Record<
  string,
  { color: string; bg: string; icon: typeof CheckCircle2; label: string }
> = {
  done: { color: '#34D399', bg: 'rgba(52,211,153,0.12)', icon: CheckCircle2, label: 'Done' },
  'in-progress': { color: '#F5B74D', bg: 'rgba(245,183,77,0.12)', icon: Clock, label: 'In Progress' },
  'sprint-ready': { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', icon: Zap, label: 'Sprint Ready' },
  deferred: { color: '#F87171', bg: 'rgba(248,113,113,0.12)', icon: XCircle, label: 'Deferred' },
  'needs-refinement': {
    color: '#64748B',
    bg: 'rgba(148,163,184,0.06)',
    icon: BookOpen,
    label: 'Needs Refinement',
  },
}

function StatusBadgeSmall({ status }: { status: string }) {
  const cfg = statusConfig[status]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-[4px] py-[2px] px-[7px] rounded-[20px] text-[9px] font-semibold tracking-[0.02em] whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  )
}

function extractStoryNumber(slug: string): string {
  return slug.match(/ca-story(\d+)/)?.[1] || '?'
}

export function ActiveEpicSection({
  epicName,
  epicNumber,
  stories,
}: ActiveEpicSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const doneStories = stories.filter((s) => s.status === 'done')
  const deferredStories = stories.filter((s) => s.status === 'deferred')
  const activeStories = stories.filter(
    (s) => s.status !== 'done' && s.status !== 'deferred'
  )
  const totalDone = doneStories.length
  const totalStories = stories.length
  const epicPct = totalStories > 0 ? Math.round((totalDone / totalStories) * 100) : 0

  // Status summary counts
  const statusCounts = Object.entries(
    stories.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).filter(([, count]) => count > 0)

  return (
    <div className="px-[28px] pb-[20px]">
      {/* Header row — NOT inside card */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer py-[4px]"
        style={{ marginBottom: isExpanded ? 14 : 0 }}
      >
        <div className="flex items-center gap-[10px]">
          <SectionLabel color="#A78BFA">Active Epic</SectionLabel>
          <span className="font-mono text-[11px] font-bold text-[#0B1120] bg-[#A78BFA] px-[7px] py-[1px] rounded-[6px] tracking-[0.02em]">
            E{epicNumber}
          </span>
          <span className="font-display text-[14px] font-semibold text-[#F1F5F9]">
            {epicName}
          </span>
        </div>
        <div className="flex items-center gap-[10px]">
          <span className="font-mono text-[12px] text-[#F5B74D] font-semibold">
            {epicPct}%
          </span>
          <ChevronDown
            size={16}
            className="text-[#64748B] transition-transform duration-200"
            style={{
              transform: isExpanded ? 'rotate(0)' : 'rotate(-90deg)',
            }}
          />
        </div>
      </div>

      {/* Body card */}
      {isExpanded && (
        <div className="bg-[#131B2E] rounded-[16px] overflow-hidden border border-[rgba(148,163,184,0.08)]">
          {/* Progress bar + status summary */}
          <div className="py-[14px] px-[20px] border-b border-[rgba(148,163,184,0.08)]">
            <div className="flex items-center gap-[12px]">
              <div className="flex-1 h-[6px] bg-[#1A2540] rounded-[3px] overflow-hidden">
                <div
                  className="h-full bg-[#F5B74D] rounded-[3px]"
                  style={{ width: `${epicPct}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-[#64748B]">
                {totalDone}/{totalStories}
              </span>
            </div>
            <div className="flex gap-[12px] mt-[8px]">
              {statusCounts.map(([status, count]) => {
                const cfg = statusConfig[status]
                if (!cfg) return null
                return (
                  <span
                    key={status}
                    className="flex items-center gap-[4px] text-[10px] text-[#64748B]"
                  >
                    <span
                      className="w-[6px] h-[6px] rounded-[2px]"
                      style={{ background: cfg.color }}
                    />
                    {cfg.label} ({count})
                  </span>
                )
              })}
            </div>
          </div>

          <div className="py-[14px] px-[20px]">
            {/* Active stories as 2-col card grid */}
            {activeStories.length > 0 && (
              <div className="grid grid-cols-2 gap-[8px] mb-[12px]">
                {activeStories.map((story) => {
                  const cfg = statusConfig[story.status]
                  const num = extractStoryNumber(story.slug)
                  return (
                    <Link
                      key={story.id}
                      href={`/admin/pm/stories/${story.slug}`}
                      className="block"
                    >
                      <div
                        className="bg-[#1A2540] rounded-[10px] py-[12px] px-[14px] border border-[rgba(148,163,184,0.08)] transition-colors hover:border-[rgba(245,183,77,0.15)]"
                        style={{ borderLeftWidth: 3, borderLeftColor: cfg?.color }}
                      >
                        <div className="flex items-center justify-between mb-[4px]">
                          <span className="font-mono text-[10px] text-[#64748B]">
                            #{num}
                          </span>
                          <StatusBadgeSmall status={story.status} />
                        </div>
                        <div className="text-[13px] font-semibold text-[#F1F5F9]">
                          {story.name}
                        </div>
                        {(story.sprint || story.effort) && (
                          <div className="text-[10px] text-[#475569] font-mono mt-[4px]">
                            {[story.sprint, story.effort]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Completed stories */}
            {doneStories.length > 0 && (
              <>
                <div className="text-[10px] text-[#64748B] tracking-[0.08em] font-semibold uppercase mb-[6px]">
                  Completed ({doneStories.length})
                </div>
                <div className="flex flex-col gap-[2px]">
                  {doneStories.map((story) => {
                    const num = extractStoryNumber(story.slug)
                    return (
                      <Link
                        key={story.id}
                        href={`/admin/pm/stories/${story.slug}`}
                        className="block"
                      >
                        <div className="py-[6px] px-[8px] rounded-[6px] flex items-center gap-[8px] transition-colors hover:bg-[#1A2540]">
                          <CheckCircle2
                            size={12}
                            className="text-[#34D399] shrink-0"
                          />
                          <span className="font-mono text-[10px] text-[#475569]">
                            #{num}
                          </span>
                          <span className="text-[12px] text-[#64748B]">
                            {story.name}
                          </span>
                          {story.sprint && (
                            <span className="text-[10px] font-mono text-[#475569] ml-auto">
                              {story.sprint}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}

            {/* Deferred stories */}
            {deferredStories.length > 0 && (
              <>
                <div className="text-[10px] text-[#64748B] tracking-[0.08em] font-semibold uppercase mb-[6px] mt-[10px]">
                  Deferred
                </div>
                {deferredStories.map((story) => {
                  const num = extractStoryNumber(story.slug)
                  return (
                    <div
                      key={story.id}
                      className="py-[6px] px-[8px] rounded-[6px] flex items-center gap-[8px]"
                    >
                      <XCircle
                        size={12}
                        className="text-[#F87171] shrink-0"
                      />
                      <span className="font-mono text-[10px] text-[#475569]">
                        #{num}
                      </span>
                      <span className="text-[12px] text-[#475569]">
                        {story.name}
                      </span>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
