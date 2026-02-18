/**
 * PM Dashboard Landing Page
 * Version: 2.0 (payload_phases + dynamic epic + ratio metrics)
 * Story: ca-story41-pm-dashboard-coherence
 *
 * Full PM dashboard with phase progress, active epic, knowledge docs, epic roadmap
 * Changelog:
 *   1.1 — Initial cached version (Story 29)
 *   2.0 — payload_phases query, dynamic active epic, ratio metrics,
 *          section reorder to match prototype (Story 41)
 */

import configPromise from '@payload-config'
import { cachedFind } from '@/lib/payloadCache'

import { PhaseProgressHero } from '@/components/pm/PhaseProgressHero'
import { ActiveEpicSection } from '@/components/pm/ActiveEpicSection'
import { KnowledgeSection } from '@/components/pm/KnowledgeSection'
import { EpicRoadmap } from '@/components/pm/EpicRoadmap'
import { MetricStrip } from '@/components/pm/MetricStrip'

// Cache PM dashboard data for 5 minutes (revalidate every 300s)
const CACHE_TIME = 300

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract epic number from slug: "ca-epic5-user-interface" → 5 */
function extractEpicNumber(slug: string): number {
  const match = slug.match(/ca-epic(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Epic = {
  id: string
  name: string
  slug: string
  status: string
}

type Story = {
  id: string
  name: string
  slug: string
  status: 'done' | 'in-progress' | 'sprint-ready' | 'needs-refinement' | 'deferred'
  complexity?: string
  effort?: string
  epic?: string
  sprint?: string
}

type KnowledgeEntry = {
  id: string
  title: string
  category: string
  audience: string
}

type Sprint = {
  id: string
  name: string
  slug: string
  status: 'active' | 'completed' | 'planned'
  sprint_number?: string
}

type Phase = {
  id: number
  name: string
  phase_number: string
  stage_number: string | null
  status: string
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PMDashboardPage() {
  // Parallel fetch all data with cache
  const [epicsResult, storiesResult, knowledgeResult, sprintResult, phasesResult] =
    await Promise.all([
      cachedFind(
        configPromise,
        {
          collection: 'payload-epics',
          depth: 0,
          limit: 20,
        },
        CACHE_TIME,
        ['pm-dashboard'],
      ),
      cachedFind(
        configPromise,
        {
          collection: 'payload-stories',
          depth: 0,
          limit: 200,
        },
        CACHE_TIME,
        ['pm-dashboard'],
      ),
      cachedFind(
        configPromise,
        {
          collection: 'payload-knowledge-entries',
          depth: 0,
          limit: 200,
        },
        CACHE_TIME,
        ['pm-dashboard'],
      ),
      cachedFind(
        configPromise,
        {
          collection: 'payload-sprints',
          where: { status: { equals: 'active' } },
          depth: 0,
          limit: 1,
        },
        CACHE_TIME,
        ['pm-dashboard'],
      ),
      cachedFind(
        configPromise,
        {
          collection: 'payload-phases',
          where: { phase_number: { equals: 2 } },
          sort: 'stage_number',
          depth: 0,
          limit: 20,
        },
        CACHE_TIME,
        ['pm-dashboard'],
      ),
    ])

  const allEpics = epicsResult.docs as Epic[]
  const allStories = storiesResult.docs as Story[]
  const allKnowledgeUnfiltered = knowledgeResult.docs as KnowledgeEntry[]
  const activeSprint = sprintResult.docs[0] as Sprint | undefined
  const phasesDocs = phasesResult.docs as Phase[]

  // ---------------------------------------------------------------------------
  // Phase processing — parent phase + child stages from payload_phases
  // ---------------------------------------------------------------------------
  const activePhase = phasesDocs.find((p) => p.stage_number === null)
  const activePhaseNumber = activePhase?.phase_number
  const allKnowledge = activePhaseNumber
    ? allKnowledgeUnfiltered.filter((k: any) => String(k.phase) === String(activePhaseNumber))
    : allKnowledgeUnfiltered
  const phaseStages = phasesDocs
    .filter((p) => p.stage_number !== null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stageNumber: parseInt(p.stage_number as string, 10),
      status:
        p.status === 'complete'
          ? ('done' as const)
          : p.status === 'active'
            ? ('in-progress' as const)
            : ('not-started' as const),
    }))
  const stagesDone = phaseStages.filter((s) => s.status === 'done').length
  const phasePct = phaseStages.length > 0
    ? Math.round((stagesDone / phaseStages.length) * 100)
    : 0

  // ---------------------------------------------------------------------------
  // Active epic — dynamic detection (first in-progress / active)
  // ---------------------------------------------------------------------------
  const activeEpic = allEpics.find(
    (e) => e.status === 'in-progress' || e.status === 'active',
  )
  const activeEpicStories = activeEpic
    ? allStories.filter((s) => s.epic === activeEpic.id)
    : []

  // ---------------------------------------------------------------------------
  // Epic roadmap — story counts per epic
  // ---------------------------------------------------------------------------
  const epicsWithCounts = allEpics.map((epic) => {
    const epicStories = allStories.filter((s) => s.epic === epic.id)
    const doneCount = epicStories.filter((s) => s.status === 'done').length
    return {
      id: epic.id,
      name: epic.name,
      slug: epic.slug,
      epicNumber: extractEpicNumber(epic.slug),
      status: epic.status,
      storyCount: epicStories.length,
      doneCount,
    }
  })

  // ---------------------------------------------------------------------------
  // Metrics — ratio format matching prototype
  // ---------------------------------------------------------------------------
  const totalEpics = allEpics.length
  const epicsDone = allEpics.filter(
    (e) => e.status === 'done' || e.status === 'complete',
  ).length
  const totalStories = allStories.length
  const doneStories = allStories.filter((s) => s.status === 'done').length

  const metrics = [
    { label: 'Epics', value: `${epicsDone}/${totalEpics}`, color: 'positive' as const },
    { label: 'Stories', value: `${doneStories}/${totalStories}`, color: 'accent' as const },
    {
      label: 'Sprint',
      value: activeSprint?.slug?.replace('ca-sprint', '') || '—',
      color: 'blue' as const,
    },
    { label: 'Knowledge', value: `${allKnowledge.length}`, color: 'purple' as const },
  ]

  // ---------------------------------------------------------------------------
  // Render — section order matches prototype:
  //   Hero → MetricStrip → ActiveEpic → Knowledge → Roadmap
  // ---------------------------------------------------------------------------
  return (
    <div>
      {/* Navigation */}


      {/* Phase Progress Hero */}
      <PhaseProgressHero
        phaseName={activePhase?.name || 'Interface, UX & Delivery'}
        phaseNumber={2}
        activeStage={phaseStages.find((s) => s.status === 'in-progress')}
        stages={phaseStages}
        stagesDone={stagesDone}
        phasePct={phasePct}
        releaseVersion="v0.4"
      />

      {/* Metric Strip */}
      <MetricStrip metrics={metrics} />

      {/* Active Epic */}
      {activeEpic && activeEpicStories.length > 0 && (
        <ActiveEpicSection
          epicName={activeEpic.name}
          epicNumber={extractEpicNumber(activeEpic.slug)}
          stories={activeEpicStories}
        />
      )}

      {/* Knowledge Documents */}
      {allKnowledge.length > 0 && (
        <KnowledgeSection documents={allKnowledge} />
      )}

      {/* Epic Roadmap */}
      <EpicRoadmap epics={epicsWithCounts} />
    </div>
  )
}
