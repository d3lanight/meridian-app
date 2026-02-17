/**
 * PhaseProgressHero Component
 * Version: 1.0
 * Story: ca-story29-pm-dashboard
 * 
 * Phase progress with segmented bar and release card
 */

'use client'

interface PhaseStage {
  id: number
  name: string
  status: 'done' | 'in-progress' | 'not-started'
}

interface PhaseProgressHeroProps {
  currentPhase: string
  releaseVersion: string
  stages: PhaseStage[]
  upcomingPhases: string[]
}

export function PhaseProgressHero({
  currentPhase,
  releaseVersion,
  stages,
  upcomingPhases,
}: PhaseProgressHeroProps) {
  const doneCount = stages.filter(s => s.status === 'done').length
  const totalCount = stages.length
  const progressPercent = Math.round((doneCount / totalCount) * 100)

  return (
    <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-6">
      <div className="flex items-start justify-between gap-6 mb-6">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-[#F1F5F9] mb-1">
            Product Management
          </h2>
          <p className="text-sm text-[#94A3B8]">
            Phase {currentPhase} • {progressPercent}% complete
          </p>
        </div>

        {/* Release Card */}
        <div className="bg-[#0B1120] border border-[#1E293B] rounded-lg px-4 py-3 min-w-[140px]">
          <div className="text-xs text-[#64748B] mb-1">Current Release</div>
          <div className="text-lg font-bold text-[#F1F5F9]">{releaseVersion}</div>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="mb-4">
        <div className="flex gap-1 mb-3">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{
                background:
                  stage.status === 'done'
                    ? '#34D399'
                    : stage.status === 'in-progress'
                    ? '#F5B74D'
                    : '#1E293B',
              }}
            />
          ))}
        </div>

        {/* Stage Labels */}
        <div className="grid grid-cols-6 gap-2">
          {stages.map((stage) => (
            <div key={stage.id} className="text-center">
              <div
                className={`text-xs font-medium ${
                  stage.status === 'done'
                    ? 'text-[#34D399]'
                    : stage.status === 'in-progress'
                    ? 'text-[#F5B74D]'
                    : 'text-[#64748B]'
                }`}
              >
                {stage.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Phases */}
      {upcomingPhases.length > 0 && (
        <div className="pt-4 border-t border-[#1E293B]">
          <div className="text-xs text-[#64748B] mb-2">Up Next</div>
          <div className="flex gap-2">
            {upcomingPhases.map((phase, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded bg-[#1E293B] text-[#94A3B8]"
              >
                {phase}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
