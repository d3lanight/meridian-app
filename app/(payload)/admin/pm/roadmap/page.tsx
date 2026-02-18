import { getPayload } from 'payload'
import config from '@payload-config'
import { RoadmapClient } from '@/components/pm/RoadmapClient'

export default async function PhaseRoadmapPage() {
  const payload = await getPayload({ config })

  // Get all phases + stages in one query, filter in JS
  const allPhasesResult = await payload.find({
    collection: 'payload-phases',
    depth: 0,
    limit: 50,
    sort: 'phase_number',
  })

  const parentPhases = (allPhasesResult.docs as any[]).filter(p => p.stage_number == null)
  const allStages = (allPhasesResult.docs as any[]).filter(p => p.stage_number != null)

  // Get all stories with epic relation
  const storiesResult = await payload.find({
    collection: 'payload-stories',
    depth: 1,
    limit: 200,
    sort: 'id',
  })

  // Get all epics
  const epicsResult = await payload.find({
    collection: 'payload-epics',
    depth: 0,
    limit: 50,
    sort: 'id',
  })

  // Build phase data
  const phases = parentPhases.map((phase: any) => {
    const phaseNum = String(phase.phase_number)

    const stages = allStages
      .filter((s: any) => String(s.phase_number) === phaseNum)
      .sort((a: any, b: any) => Number(a.stage_number) - Number(b.stage_number))
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        phase_number: String(s.phase_number),
        stage_number: String(s.stage_number),
        status: s.status,
      }))

    const phaseStories = (storiesResult.docs as any[]).filter(
      (s) => String(s.phase) === phaseNum
    )

    const epicIds = new Set<number>()
    for (const s of phaseStories) {
      const epicObj = typeof s.epic === 'object' ? s.epic : null
      if (epicObj) epicIds.add(epicObj.id)
    }

    const epics = Array.from(epicIds)
      .map((epicId) => {
        const epic = (epicsResult.docs as any[]).find((e) => e.id === epicId)
        if (!epic) return null
        const epicStories = phaseStories.filter((s: any) => {
          const eObj = typeof s.epic === 'object' ? s.epic : null
          return eObj?.id === epicId
        })
        return {
          id: epic.id,
          name: epic.name,
          slug: epic.slug,
          status: epic.status,
          storyCount: epicStories.length,
          doneCount: epicStories.filter((s: any) => s.status === 'done').length,
        }
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a: any, b: any) => a.id - b.id)

    return {
      id: phase.id,
      name: phase.name,
      phase_number: phaseNum,
      status: phase.status,
      stages,
      epics,
      storyCount: phaseStories.length,
      doneCount: phaseStories.filter((s: any) => s.status === 'done').length,
    }
  })

  const totalPhases = phases.length
  const activeStages = allStages.filter((s: any) => s.status === 'active').length

  return (
    <div className="pb-10">
      <div style={{ padding: '28px 28px 8px' }}>
        <h1
          className="font-display font-bold text-[#F1F5F9]"
          style={{ fontSize: 24, letterSpacing: '-0.02em', margin: '0 0 6px' }}
        >
          Phase Roadmap
        </h1>
        <p className="font-body text-xs text-[#64748B]">
          {totalPhases} phases · {activeStages} active stage{activeStages !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ padding: '16px 0 0' }}>
        <RoadmapClient phases={phases} />
      </div>
    </div>
  )
}
