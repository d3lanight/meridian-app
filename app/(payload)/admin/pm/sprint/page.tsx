/**
 * Sprint Dashboard Page
 * Version: 1.1 (with cache)
 * Story: ca-story31-sprint-dashboard
 * 
 * Main PM dashboard showing active sprint metrics and stories
 * Performance: Cached queries with 5-minute revalidation
 */

import configPromise from '@payload-config'
import { cachedFind } from '@/lib/payloadCache'
import { PMNav } from '@/components/pm/PMNav'
import { MetricCard } from '@/components/pm/MetricCard'
import { StatusBadge } from '@/components/pm/StatusBadge'
import { ComplexityDots } from '@/components/pm/ComplexityDots'
import { ProgressBar } from '@/components/pm/ProgressBar'
import Link from 'next/link'

const CACHE_TIME = 300 // 5 minutes


type Story = {
  id: string
  name: string
  slug: string
  status: 'done' | 'in-progress' | 'sprint-ready' | 'needs-refinement' | 'deferred'
  complexity: 'low' | 'medium' | 'high'
  effort: number
  epic?: string
  sprint?: string
}

type Sprint = {
  id: string
  name: string
  sprintNumber: number
  status: 'planned' | 'active' | 'completed'
  startDate: string
  endDate: string
  goal?: any
}

// Extract story number from slug (ca-story31-slug → #31)
function getStoryNumber(slug: string): string {
  const match = slug.match(/ca-story(\d+)/)
  return match ? `#${match[1]}` : ''
}

// Sort stories: in-progress → sprint-ready → needs-refinement
const statusOrder: Record<Story['status'], number> = { 
  'in-progress': 0, 
  'sprint-ready': 1, 
  'needs-refinement': 2,
  'done': 999,
  'deferred': 999
}
function sortStories(stories: Story[]) {
  return stories.sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 999
    const orderB = statusOrder[b.status] ?? 999
    return orderA - orderB
  })
}

export default async function SprintDashboardPage() {
  // Get active sprint (cached)
  const sprintResult = await cachedFind(
    configPromise,
    {
      collection: 'payload-sprints',
      where: { status: { equals: 'active' } },
      depth: 0,
      limit: 1,
    },
    CACHE_TIME,
    ['sprint-dashboard']
  )

  const activeSprint = sprintResult.docs[0] as Sprint | undefined

  if (!activeSprint) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-[#F1F5F9] p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Sprint Dashboard</h1>
          <p className="text-[#94A3B8] mb-8">No active sprint found</p>
          <PMNav />
        </div>
      </div>
    )
  }

  // Get stories for active sprint (cached)
  const storiesResult = await cachedFind(
    configPromise,
    {
      collection: 'payload-stories',
      where: { sprint: { equals: activeSprint.id } },
      depth: 0,
      limit: 100,
    },
    CACHE_TIME,
    ['sprint-dashboard']
  )

  const allStories = storiesResult.docs as Story[]

  // Filter active stories (exclude done/deferred)
  const activeStories = allStories.filter(
    s => s.status !== 'done' && s.status !== 'deferred'
  )
  const doneStories = allStories.filter(s => s.status === 'done')
  const deferredStories = allStories.filter(s => s.status === 'deferred')

  // Sort active stories
  const sortedActiveStories = sortStories(activeStories)

  // Calculate metrics
  const totalStories = allStories.length
  const completedCount = doneStories.length
  const inProgressCount = allStories.filter(s => s.status === 'in-progress').length
  const progressPercentage = Math.round((completedCount / totalStories) * 100)

  // Get unique epics
  const epicIds = new Set(allStories.map(s => s.epic).filter(Boolean))

  // Determine phase (simple logic based on sprint number)
  const phase = activeSprint.sprintNumber <= 3 ? 'Foundation' :
                activeSprint.sprintNumber <= 6 ? 'Migration' : 'Feature Build'

  // Calculate days remaining
  const endDate = new Date(activeSprint.endDate)
  const today = new Date()
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F1F5F9] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{activeSprint.name}</h1>
          <p className="text-[#94A3B8]">
            Sprint {activeSprint.sprintNumber} • {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
          </p>
        </div>

        {/* Navigation */}
        <PMNav />

        {/* Metrics Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Progress"
            value={`${progressPercentage}%`}
            subtitle={`${completedCount} of ${totalStories} stories`}
            color="positive"
            delay={0}
          />
          <MetricCard
            label="Phase"
            value={phase}
            subtitle={`Sprint ${activeSprint.sprintNumber}`}
            color="accent"
            delay={100}
          />
          <MetricCard
            label="Epics"
            value={epicIds.size}
            subtitle={`${inProgressCount} in progress`}
            color="blue"
            delay={200}
          />
          <MetricCard
            label="Scope"
            value={`${daysRemaining}d`}
            subtitle="remaining"
            color="purple"
            delay={300}
          />
        </div>

        {/* Active Stories */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Stories</h2>
          <div className="space-y-3">
            {sortedActiveStories.map((story, index) => (
              <Link
                key={story.id}
                href={`/admin/pm/stories/${story.slug}`}
                className="block"
              >
                <div
                  className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-5 hover:border-[#F5B74D]/30 transition-all cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${400 + index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-[#64748B]">
                            {getStoryNumber(story.slug)}
                        </span>
                        <StatusBadge status={story.status} size="sm" />
                      </div>
                      <h3 className="text-[#F1F5F9] font-medium mb-1">{story.name}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <ComplexityDots level={story.complexity} showLabel={false} />
                      <span className="text-sm text-[#94A3B8] font-mono">
                        {story.effort}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Done/Deferred Footer */}
          {(doneStories.length > 0 || deferredStories.length > 0) && (
            <div className="mt-4 pt-4 border-t border-[#1E293B] flex gap-6 text-sm text-[#64748B]">
              {doneStories.length > 0 && (
                <span>{doneStories.length} done</span>
              )}
              {deferredStories.length > 0 && (
                <span>{deferredStories.length} deferred</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
