/**
 * Story Board Page
 * Version: 1.0
 * Story: ca-story31-sprint-dashboard
 * 
 * Stories grouped by status with drill-down
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PMNav } from '@/components/pm/PMNav'
import { StatusBadge } from '@/components/pm/StatusBadge'
import { ComplexityDots } from '@/components/pm/ComplexityDots'
import Link from 'next/link'

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
  sprintNumber: number | string
}

// Extract story number from slug
function getStoryNumber(slug: string): string {
  const match = slug.match(/ca-story(\d+)/)
  return match ? `#${match[1]}` : ''
}

// Group stories by status
function groupByStatus(stories: Story[]) {
  const groups = {
    'in-progress': [] as Story[],
    'sprint-ready': [] as Story[],
    'needs-refinement': [] as Story[],
    'done': [] as Story[],
    'deferred': [] as Story[],
  }

  stories.forEach(story => {
    if (groups[story.status]) {
      groups[story.status].push(story)
    }
  })

  return groups
}

export default async function StoryBoardPage() {
  const payload = await getPayload({ config: configPromise })

  // Get all stories
  const storiesResult = await payload.find({
    collection: 'payload-stories',
    depth: 0,
    limit: 200,
    sort: '-updated_at',
  })

  const stories = storiesResult.docs as Story[]
  const groupedStories = groupByStatus(stories)

  // Get sprint names for display
  const sprintsResult = await payload.find({
    collection: 'payload-sprints',
    depth: 0,
    limit: 100,
  })
  const sprints = sprintsResult.docs as Sprint[]
  const sprintMap = new Map(sprints.map(s => [s.id, s]))

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F1F5F9] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Story Board</h1>
          <p className="text-[#94A3B8]">All stories grouped by status</p>
        </div>

        {/* Navigation */}
        <PMNav />

        {/* Story Groups */}
        <div className="space-y-8">
          {Object.entries(groupedStories).map(([status, statusStories]) => {
            if (statusStories.length === 0) return null

            return (
              <div key={status}>
                <div className="flex items-center gap-3 mb-4">
                  <StatusBadge status={status as any} />
                  <span className="text-[#64748B] text-sm">
                    {statusStories.length} {statusStories.length === 1 ? 'story' : 'stories'}
                  </span>
                </div>

                <div className="space-y-3">
                  {statusStories.map((story) => {
                    const sprint = story.sprint ? sprintMap.get(story.sprint) : null

                    return (
                      <Link
                        key={story.id}
                        href={`/admin/pm/stories/${story.slug}`}
                        className="block"
                      >
                        <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-5 hover:border-[#F5B74D]/30 transition-all cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-mono text-[#64748B]">
                                  {getStoryNumber(story.slug)}
                                </span>
                                {sprint && (
                                  <span className="text-xs text-[#64748B]">
                                    S{sprint.sprintNumber || '?'}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-[#F1F5F9] font-medium">{story.name}</h3>
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
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}