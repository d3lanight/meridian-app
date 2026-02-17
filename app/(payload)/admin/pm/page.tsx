/**
 * PM Dashboard Landing Page
 * Version: 1.1 (witch cache)
 * Story: ca-story29-pm-dashboard
 * 
 * Full PM dashboard with phase progress, active epic, knowledge docs, epic roadmap
 */

import configPromise from '@payload-config'
import { cachedFind } from '@/lib/payloadCache'
import { PMNav } from '@/components/pm/PMNav'
import { PhaseProgressHero } from '@/components/pm/PhaseProgressHero'
import { ActiveEpicSection } from '@/components/pm/ActiveEpicSection'
import { KnowledgeSection } from '@/components/pm/KnowledgeSection'
import { EpicRoadmap } from '@/components/pm/EpicRoadmap'
import { MetricStrip } from '@/components/pm/MetricStrip'

// Cache PM dashboard data for 5 minutes (revalidate every 300s)
const CACHE_TIME = 300

// Next.js route segment config
export const revalidate = CACHE_TIME
export const dynamic = 'force-static'

type Epic = {
  id: string
  name: string
  slug: string
  epic_number: number
  status: 'done' | 'in-progress' | 'planned'
}

type Story = {
  id: string
  name: string
  slug: string
  status: 'done' | 'in-progress' | 'sprint-ready' | 'needs-refinement' | 'deferred'
  epic?: string
}

type KnowledgeEntry = {
  id: string
  title: string
  category: string
  audience: string
}

type Sprint = {
  id: string
  status: 'active' | 'completed' | 'planned'
}

export default async function PMDashboardPage() {

  // Parallel fetch all data with cache
  const [epicsResult, storiesResult, knowledgeResult, sprintResult] = await Promise.all([
    cachedFind(
      configPromise,
      {
        collection: 'payload-epics',
        depth: 0,
        limit: 20,
        sort: 'epic_number',
      },
      CACHE_TIME,
      ['pm-dashboard']
    ),
    cachedFind(
      configPromise,
      {
        collection: 'payload-stories',
        depth: 0,
        limit: 200,
      },
      CACHE_TIME,
      ['pm-dashboard']
    ),
    cachedFind(
      configPromise,
      {
        collection: 'payload-knowledge-entries',
        depth: 0,
        limit: 200,
      },
      CACHE_TIME,
      ['pm-dashboard']
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
      ['pm-dashboard']
    ),
  ])

  const allEpics = epicsResult.docs as Epic[]
  const allStories = storiesResult.docs as Story[]
  const allKnowledge = knowledgeResult.docs as KnowledgeEntry[]
  const activeSprint = sprintResult.docs[0] as Sprint | undefined

  // Filter Epic 4 (active epic)
  const epic4 = allEpics.find(e => e.epic_number === 4)
  const epic4Stories = epic4
    ? allStories.filter(s => s.epic === epic4.id)
    : []

  // Calculate epic story counts for roadmap
  const epicsWithCounts = allEpics.map(epic => {
    const epicStories = allStories.filter(s => s.epic === epic.id)
    const doneCount = epicStories.filter(s => s.status === 'done').length
    return {
      id: epic.id,
      name: epic.name,
      slug: epic.slug,
      epicNumber: epic.epic_number,
      status: epic.status,
      storyCount: epicStories.length,
      doneCount,
    }
  })

  // Phase stages (hardcoded v1)
  const phaseStages = [
    { id: 1, name: 'Foundation', status: 'done' as const },
    { id: 2, name: 'PM Collections', status: 'done' as const },
    { id: 3, name: 'Content Migration', status: 'done' as const },
    { id: 4, name: 'Dashboard Dev', status: 'in-progress' as const },
    { id: 5, name: 'API Integration', status: 'not-started' as const },
    { id: 6, name: 'Testing & Polish', status: 'not-started' as const },
  ]

  // Metrics
  const totalEpics = allEpics.length
  const activeEpics = allEpics.filter(e => e.status === 'in-progress').length
  const totalStories = allStories.length
  const doneStories = allStories.filter(s => s.status === 'done').length

  const metrics = [
    { label: 'Total Epics', value: totalEpics, color: 'purple' as const },
    { label: 'Active Epics', value: activeEpics, color: 'accent' as const },
    { label: 'Stories Done', value: doneStories, color: 'positive' as const },
    { label: 'Total Stories', value: totalStories, color: 'blue' as const },
  ]

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F1F5F9] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Management</h1>
          <p className="text-[#94A3B8]">Sprint planning, epic tracking, and knowledge hub</p>
        </div>

        {/* Navigation */}
        <PMNav />

        {/* Phase Progress Hero */}
        <PhaseProgressHero
          currentPhase="v0.4"
          releaseVersion="v0.4.0"
          stages={phaseStages}
          upcomingPhases={['API Integration', 'Testing & Polish']}
        />

        {/* Active Epic */}
        {epic4 && epic4Stories.length > 0 && (
          <ActiveEpicSection
            epicName={epic4.name}
            epicNumber={epic4.epic_number}
            stories={epic4Stories}
          />
        )}

        {/* Knowledge Documents */}
        {allKnowledge.length > 0 && (
          <KnowledgeSection documents={allKnowledge} />
        )}

        {/* Epic Roadmap */}
        <EpicRoadmap epics={epicsWithCounts} />

        {/* Metric Strip */}
        <MetricStrip metrics={metrics} />
      </div>
    </div>
  )
}
