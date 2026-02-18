/**
 * Sprint Goals Page
 * Version: 1.1 (with cache)
 * Story: ca-story31-sprint-dashboard
 * 
 * All sprints with goal content
 * Performance: Cached queries with 5-minute revalidation
 */

import configPromise from '@payload-config'
import { cachedFind } from '@/lib/payloadCache'

import Link from 'next/link'

const CACHE_TIME = 300 // 5 minutes


type Sprint = {
  id: string
  name: string
  slug: string
  sprintNumber: number | string
  status: 'planned' | 'active' | 'completed'
  startDate: string
  endDate: string
  goal?: any
}

// Extract plain text from Lexical JSON
function extractText(lexical: any): string {
  if (!lexical?.root?.children) return ''
  
  return lexical.root.children
    .map((node: any) => {
      if (node.children) {
        return node.children.map((c: any) => c.text || '').join(' ')
      }
      return ''
    })
    .join(' ')
    .trim()
}

// Get status badge color
function getStatusColor(status: string) {
  const colors = {
    active: 'text-[#F5B74D] bg-[#F5B74D]/10',
    completed: 'text-[#34D399] bg-[#34D399]/10',
    planned: 'text-[#94A3B8] bg-[#94A3B8]/10',
  }
  return colors[status as keyof typeof colors] || colors.planned
}

export default async function SprintGoalsPage() {
  // Get all sprints, sorted by sprint number descending (cached)
  const sprintsResult = await cachedFind(
    configPromise,
    {
      collection: 'payload-sprints',
      depth: 0,
      limit: 100,
      sort: '-sprint_number',
    },
    CACHE_TIME,
    ['sprint-goals']
  )

  const sprints = sprintsResult.docs as Sprint[]

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F1F5F9] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Sprint Goals</h1>
          <p className="text-[#94A3B8]">Sprint objectives and outcomes</p>
        </div>

        {/* Navigation */}


        {/* Sprint List */}
        <div className="space-y-4">
          {sprints.map((sprint, index) => {
            const goalText = extractText(sprint.goal)
            const hasGoal = goalText.length > 0

            return (
              <Link
                key={sprint.id}
                href={`/admin/pm/goals/${sprint.slug}`}
                className="block"
              >
                <div
                  className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-6 hover:border-[#F5B74D]/30 transition-all cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-[#F1F5F9]">
                          {sprint.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(sprint.status)}`}>
                          {sprint.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#64748B]">
                        {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-2xl font-mono text-[#64748B]">
                            S{sprint.sprintNumber || '?'}
                    </span>
                  </div>

                  {hasGoal && (
                    <div className="mt-4 pt-4 border-t border-[#1E293B]">
                      <p className="text-[#94A3B8] line-clamp-2">
                        {goalText}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {sprints.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#64748B]">No sprints found</p>
          </div>
        )}
      </div>
    </div>
  )
}
