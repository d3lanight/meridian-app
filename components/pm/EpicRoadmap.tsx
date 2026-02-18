/**
 * EpicRoadmap Component
 * Version: 2.0
 * Story: ca-story41-pm-dashboard-coherence
 *
 * 3-column epic grid with colored top bars and status-aware progress.
 * Matches pm-dashboard-b-v2.jsx lines 667–723.
 */

'use client'

import Link from 'next/link'
import { SectionLabel } from '@/components/pm/SectionLabel'

interface Epic {
  id: string
  name: string
  slug: string
  epicNumber: number
  status: string
  storyCount: number
  doneCount: number
}

interface EpicRoadmapProps {
  epics: Epic[]
}

const statusColors: Record<string, { bar: string; barOpacity: number; text: string; fill: string }> = {
  complete: { bar: '#34D399', barOpacity: 0.8, text: '#34D399', fill: '#34D399' },
  done:     { bar: '#34D399', barOpacity: 0.8, text: '#34D399', fill: '#34D399' },
  active:   { bar: '#F5B74D', barOpacity: 0.8, text: '#F5B74D', fill: '#F5B74D' },
  'in-progress': { bar: '#F5B74D', barOpacity: 0.8, text: '#F5B74D', fill: '#F5B74D' },
  planned:  { bar: '#64748B', barOpacity: 0.3, text: '#64748B', fill: '#475569' },
}

function getStatusStyle(status: string) {
  return statusColors[status] || statusColors.planned
}

function isActiveEpic(status: string): boolean {
  return status === 'active' || status === 'in-progress'
}

export function EpicRoadmap({ epics }: EpicRoadmapProps) {
  // Build rows of 3
  const rows: Epic[][] = []
  for (let i = 0; i < epics.length; i += 3) {
    rows.push(epics.slice(i, i + 3))
  }

  return (
    <div className="px-[28px] pb-[28px]">
      <div className="mb-[14px]">
        <SectionLabel>Epic Roadmap</SectionLabel>
      </div>

      {rows.map((row, rowIdx) => {
        const isOrphanRow = row.length < 3
        return (
          <div
            key={rowIdx}
            className="flex gap-[8px]"
            style={{
              marginBottom: rowIdx < rows.length - 1 ? 8 : 0,
            }}
          >
            {row.map((epic) => {
              const style = getStatusStyle(epic.status)
              const pct =
                epic.storyCount > 0
                  ? Math.round((epic.doneCount / epic.storyCount) * 100)
                  : 0
              const active = isActiveEpic(epic.status)

              return (
                <Link
                  key={epic.id}
                  href={`/admin/collections/epics/${epic.id}`}
                  className="block"
                  style={{
                    flex: isOrphanRow ? 'none' : '1 1 0',
                    width: isOrphanRow ? 'calc(33.33% - 3px)' : undefined,
                    minWidth: 0,
                  }}
                >
                  <div
                    className="bg-[#131B2E] rounded-[12px] py-[14px] px-[16px] relative overflow-hidden transition-colors"
                    style={{
                      border: `1px solid ${
                        active
                          ? 'rgba(245,183,77,0.10)'
                          : 'rgba(148,163,184,0.08)'
                      }`,
                    }}
                  >
                    {/* Colored top bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[3px]"
                      style={{
                        background: style.bar,
                        opacity: style.barOpacity,
                      }}
                    />

                    {/* Badge + name */}
                    <div className="flex items-center gap-[8px] mb-[8px] mt-[2px]">
                      <span
                        className="font-mono text-[10px] font-bold"
                        style={{ color: style.text }}
                      >
                        E{epic.epicNumber}
                      </span>
                      <span
                        className="text-[12px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{
                          color: active ? '#F1F5F9' : '#94A3B8',
                        }}
                      >
                        {epic.name}
                      </span>
                    </div>

                    {/* Progress bar or empty state */}
                    {epic.storyCount > 0 ? (
                      <div className="flex items-center gap-[8px]">
                        <div className="flex-1 h-[4px] bg-[#1A2540] rounded-[2px] overflow-hidden">
                          <div
                            className="h-full rounded-[2px]"
                            style={{
                              width: `${pct}%`,
                              background: style.fill,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-[#64748B]">
                          {epic.doneCount}/{epic.storyCount}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#475569] italic">
                        No stories yet
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )
      })}

      {epics.length === 0 && (
        <div className="text-center py-[24px] text-[12px] text-[#64748B]">
          No epics found
        </div>
      )}
    </div>
  )
}
