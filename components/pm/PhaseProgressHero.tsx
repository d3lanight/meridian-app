/**
 * PhaseProgressHero Component
 * Version: 2.0
 * Story: ca-story41-pm-dashboard-coherence
 *
 * Phase progress with gradient hero, segmented bar, release card.
 * Reads from payload_phases — no hardcoded stages.
 * Matches pm-dashboard-b-v2.jsx lines 289–381.
 */

'use client'

import { Rocket } from 'lucide-react'
import Link from 'next/link'

interface PhaseStage {
  id: number
  name: string
  stageNumber: number
  status: 'done' | 'in-progress' | 'not-started'
}

interface PhaseProgressHeroProps {
  phaseName: string
  phaseId?: number
  phaseNumber: number
  activeStage?: { name: string; stageNumber: number }
  stages: PhaseStage[]
  stagesDone: number
  phasePct: number
  releaseVersion: string
}

const statusColor: Record<string, string> = {
  done: '#34D399',
  'in-progress': '#F5B74D',
  'not-started': '#1A2540',
}

const labelColor: Record<string, string> = {
  done: '#34D399',
  'in-progress': '#F5B74D',
  'not-started': '#475569',
}

export function PhaseProgressHero({
  phaseName,
  phaseId,
  phaseNumber,
  activeStage,
  stages,
  stagesDone,
  phasePct,
  releaseVersion,
}: PhaseProgressHeroProps) {
  return (
    <div
      className="pt-[28px] px-[28px]"
      style={{
        background: 'linear-gradient(180deg, #16203A 0%, #0B1120 100%)',
      }}
    >
      {/* Top row: title left, release card right */}
      <div className="flex items-start justify-between mb-[20px]">
        {/* Title block */}
        <div>
          <div className="flex items-center gap-[8px] mb-[8px]">
            <Rocket size={15} className="text-[#F5B74D]" />
            <span className="font-mono text-[10px] text-[#F5B74D] font-semibold uppercase tracking-[0.12em]">
              Phase {phaseNumber}
            </span>
          </div>
          <h1 className="font-display text-[28px] font-bold text-[#F1F5F9] tracking-[-0.02em] m-0 mb-[4px]">
            {phaseId ? <Link href={`/admin/pm/phases/${phaseId}`} className="no-underline" style={{ color: "inherit" }}>{phaseName}</Link> : phaseName}
          </h1>
          {activeStage && (
            <p className="text-[12px] text-[#64748B] m-0">
              Stage {activeStage.stageNumber} — {activeStage.name}
            </p>
          )}
        </div>

        {/* Release version card */}
        <div className="bg-[#131B2E] rounded-[14px] py-[14px] px-[18px] border border-[rgba(245,183,77,0.10)] text-center min-w-[120px] shrink-0">
          <div className="text-[9px] tracking-[0.1em] text-[#64748B] uppercase font-semibold mb-[6px]">
            Current Release
          </div>
          <div className="font-display text-[28px] font-bold text-[#F5B74D] tracking-[-0.03em] leading-none">
            {releaseVersion}
          </div>
          <div className="text-[10px] text-[#475569] mt-[6px] border-t border-[rgba(148,163,184,0.08)] pt-[6px]">
            Next:{' '}
            <span className="text-[#A78BFA] font-semibold">v0.5</span>
          </div>
        </div>
      </div>

      {/* Compact Phase Progress Bar */}
      <div className="bg-[#131B2E] rounded-[14px] py-[16px] px-[20px] border border-[rgba(148,163,184,0.08)]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-[10px]">
          <span className="text-[11px] font-semibold text-[#94A3B8]">
            Phase Progress
          </span>
          <div className="flex items-center gap-[8px]">
            <span className="font-mono text-[13px] font-bold text-[#F5B74D]">
              {phasePct}%
            </span>
            <span className="font-mono text-[11px] text-[#64748B]">
              {stagesDone}/{stages.length} stages
            </span>
          </div>
        </div>

        {/* Segmented bar */}
        <div className="flex gap-[3px] mb-[10px]">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="flex-1 h-[8px] rounded-[4px] transition-colors duration-400"
              style={{ background: statusColor[stage.status] }}
            />
          ))}
        </div>

        {/* Stage labels */}
        <div className="flex gap-[3px]">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="flex-1 text-center text-[9px] font-semibold tracking-[0.02em] leading-tight"
              style={{ color: labelColor[stage.status] }}
            >
              {stage.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
