'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { PhaseBadge, EpicBadge } from '@/components/pm/StatusBadge'

interface Stage {
  id: number
  name: string
  phase_number: string
  stage_number: string
  status: string
}

interface Epic {
  id: number
  name: string
  slug: string
  status: string
  storyCount: number
  doneCount: number
}

interface PhaseData {
  id: number
  name: string
  phase_number: string
  status: string
  stages: Stage[]
  epics: Epic[]
  storyCount: number
  doneCount: number
}

function extractEpicNumber(slug: string): string {
  const match = slug?.match(/ca-epic(\d+)/)
  return match ? match[1] : '?'
}

const stageStatusColors: Record<string, string> = {
  complete: '#34D399',
  active: '#F5B74D',
  planned: '#94A3B8',
}

const phaseTimelineColors: Record<string, string> = {
  complete: '#34D399',
  active: '#F5B74D',
  planned: 'rgba(148,163,184,0.20)',
}

export function RoadmapClient({ phases }: { phases: PhaseData[] }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {}
    for (const p of phases) {
      init[p.id] = p.status === 'active'
    }
    return init
  })

  function toggle(id: number) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex flex-col gap-0" style={{ padding: '0 28px 32px' }}>
      {phases.map((phase, i) => {
        const isOpen = expanded[phase.id]
        const isActive = phase.status === 'active'
        const timelineColor = phaseTimelineColors[phase.status] || phaseTimelineColors.planned
        const isLast = i === phases.length - 1

        return (
          <div key={phase.id} className="relative">
            {!isLast && (
              <div
                className="absolute"
                style={{
                  left: 15,
                  top: 40,
                  bottom: 0,
                  width: 2,
                  background: timelineColor,
                }}
              />
            )}

            <div className="relative flex gap-4">
              <div
                className="shrink-0 mt-[18px] relative z-10"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: isActive ? '#F5B74D' : phase.status === 'complete' ? '#34D399' : '#131B2E',
                  border: `2px solid ${timelineColor}`,
                  marginLeft: 9,
                  boxShadow: isActive ? '0 0 8px rgba(245,183,77,0.4)' : 'none',
                }}
              />

              <div className="flex-1 mb-4" style={{ minWidth: 0 }}>
                <button
                  onClick={() => toggle(phase.id)}
                  className="w-full text-left transition-colors"
                  style={{
                    background: isActive ? '#1A2540' : '#131B2E',
                    borderRadius: 16,
                    padding: '20px 22px',
                    border: `1px solid ${isActive ? 'rgba(245,183,77,0.10)' : 'rgba(148,163,184,0.08)'}`,
                    cursor: 'pointer',
                    display: 'block',
                    color: 'inherit',
                    fontFamily: 'inherit',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xs font-semibold text-[#F5B74D]">
                          Phase {phase.phase_number}
                        </span>
                        <PhaseBadge status={phase.status} />
                      </div>

                      <Link
                        href={`/admin/pm/phases/${phase.id}`}
                        className="no-underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h2
                          className="font-display font-semibold"
                          style={{
                            fontSize: 17,
                            color: isActive ? '#F1F5F9' : '#94A3B8',
                            margin: 0,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {phase.name}
                        </h2>
                      </Link>

                      <div className="flex items-center gap-3 mt-2 font-body text-[11px] text-[#64748B]">
                        {phase.stages.length > 0 && (
                          <span>{phase.stages.length} stages</span>
                        )}
                        {phase.epics.length > 0 && (
                          <>
                            <span className="text-[#475569]">·</span>
                            <span>{phase.epics.length} epics</span>
                          </>
                        )}
                        {phase.storyCount > 0 && (
                          <>
                            <span className="text-[#475569]">·</span>
                            <span>{phase.doneCount}/{phase.storyCount} stories done</span>
                          </>
                        )}
                        {phase.stages.length === 0 && phase.epics.length === 0 && (
                          <span>No stages defined</span>
                        )}
                      </div>
                    </div>

                    {(phase.stages.length > 0 || phase.epics.length > 0) && (
                      <div className="shrink-0 mt-1">
                        {isOpen ? (
                          <ChevronDown size={16} className="text-[#64748B]" />
                        ) : (
                          <ChevronRight size={16} className="text-[#64748B]" />
                        )}
                      </div>
                    )}
                  </div>

                  {phase.storyCount > 0 && (
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        className="flex-1 overflow-hidden"
                        style={{ height: 4, background: '#0B1120', borderRadius: 2, maxWidth: 200 }}
                      >
                        <div
                          style={{
                            width: `${(phase.doneCount / phase.storyCount) * 100}%`,
                            height: '100%',
                            background: phase.status === 'complete' ? '#34D399' : '#F5B74D',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-[#64748B]">
                        {Math.round((phase.doneCount / phase.storyCount) * 100)}%
                      </span>
                    </div>
                  )}
                </button>

                {isOpen && (phase.stages.length > 0 || phase.epics.length > 0) && (
                  <div
                    className="mt-2"
                    style={{
                      background: '#131B2E',
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: '1px solid rgba(148,163,184,0.08)',
                    }}
                  >
                    {phase.stages.length > 0 && (
                      <>
                        <div
                          className="font-body text-[10px] tracking-[0.12em] text-[#F5B74D] font-semibold uppercase"
                          style={{ padding: '12px 18px 8px' }}
                        >
                          Stages
                        </div>
                        {phase.stages.map((stage) => {
                          const isStageActive = stage.status === 'active'
                          return (
                            <div
                              key={stage.id}
                              className="flex items-center justify-between"
                              style={{
                                padding: '10px 18px',
                                borderLeft: isStageActive ? '3px solid #F5B74D' : '3px solid transparent',
                                background: isStageActive ? 'rgba(245,183,77,0.04)' : 'transparent',
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="block rounded-full"
                                  style={{
                                    width: 6, height: 6,
                                    background: stageStatusColors[stage.status] || '#94A3B8',
                                  }}
                                />
                                <span className="font-mono text-[11px] text-[#64748B] min-w-[28px]">
                                  {stage.phase_number}.{stage.stage_number}
                                </span>
                                <span
                                  className="font-body text-[13px]"
                                  style={{
                                    color: isStageActive ? '#F1F5F9' : '#94A3B8',
                                    fontWeight: isStageActive ? 600 : 400,
                                  }}
                                >
                                  {stage.name}
                                </span>
                              </div>
                              <PhaseBadge status={stage.status} />
                            </div>
                          )
                        })}
                      </>
                    )}

                    {phase.epics.length > 0 && (
                      <>
                        <div
                          className="font-body text-[10px] tracking-[0.12em] text-[#F5B74D] font-semibold uppercase"
                          style={{
                            padding: '12px 18px 8px',
                            borderTop: phase.stages.length > 0 ? '1px solid rgba(148,163,184,0.08)' : undefined,
                          }}
                        >
                          Related Epics
                        </div>
                        {phase.epics.map((epic) => (
                          <Link
                            key={epic.id}
                            href={`/admin/pm/epics/${epic.id}`}
                            className="flex items-center justify-between no-underline transition-colors"
                            style={{
                              padding: '10px 18px',
                              borderLeft: epic.status === 'active' ? '3px solid #F5B74D' : '3px solid transparent',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[11px] text-[#64748B]">
                                E{extractEpicNumber(epic.slug)}
                              </span>
                              <span className="font-body text-[13px] font-semibold text-[#F1F5F9]">
                                {epic.name}
                              </span>
                              {epic.storyCount > 0 && (
                                <span className="font-mono text-[10px] text-[#475569]">
                                  {epic.doneCount}/{epic.storyCount}
                                </span>
                              )}
                            </div>
                            <EpicBadge status={epic.status} />
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
