/**
 * Sprint Detail Page
 * Version: 1.0
 * Story: ca-story31-sprint-dashboard
 * 
 * Full sprint view with goal, dates, and embedded story cards
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { StatusBadge } from '@/components/pm/StatusBadge'
import { ComplexityDots } from '@/components/pm/ComplexityDots'
import { ProgressBar } from '@/components/pm/ProgressBar'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Sprint = {
  id: string
  name: string
  slug: string
  sprintNumber: number
  status: 'planned' | 'active' | 'completed'
  startDate: string
  endDate: string
  goal?: any
}

type Story = {
  id: string
  name: string
  slug: string
  status: 'done' | 'in-progress' | 'sprint-ready' | 'needs-refinement' | 'deferred'
  complexity: 'low' | 'medium' | 'high'
  effort: number
  sprint?: string
}

// Extract plain text from Lexical JSON
function extractText(lexical: any): string {
  if (!lexical?.root?.children) return ''
  
  function processNode(node: any): string {
    if (node.text) return node.text
    
    if (node.type === 'heading' && node.children) {
      const text = node.children.map(processNode).join('')
      return `\n${text}\n\n`
    }
    
    if (node.type === 'paragraph' && node.children) {
      return node.children.map(processNode).join('') + '\n\n'
    }
    
    if (node.type === 'list' && node.children) {
      return node.children.map(processNode).join('') + '\n'
    }
    
    if (node.type === 'listitem' && node.children) {
      return '- ' + node.children.map(processNode).join('') + '\n'
    }
    
    if (node.children) {
      return node.children.map(processNode).join('')
    }
    
    return ''
  }
  
  return lexical.root.children
    .map(processNode)
    .join('')
    .trim()
}

// Extract story number from slug
function getStoryNumber(slug: string): string {
  const match = slug.match(/ca-story(\d+)/)
  return match ? `#${match[1]}` : ''
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

export default async function SprintDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  // Get sprint
  const sprintResult = await payload.find({
    collection: 'payload-sprints',
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
  })

  const sprint = sprintResult.docs[0] as Sprint | undefined
  if (!sprint) notFound()

  // Get stories for this sprint
  const storiesResult = await payload.find({
    collection: 'payload-stories',
    where: { sprint: { equals: sprint.id } },
    depth: 0,
    limit: 100,
  })

  const stories = storiesResult.docs as Story[]
  
  // Calculate metrics
  const totalStories = stories.length
  const completedStories = stories.filter(s => s.status === 'done')
  const inProgressStories = stories.filter(s => s.status === 'in-progress')
  const progressPercentage = totalStories > 0 ? Math.round((completedStories.length / totalStories) * 100) : 0

  // Extract goal text
  const goalText = extractText(sprint.goal)

  // Calculate date info
  const startDate = new Date(sprint.startDate)
  const endDate = new Date(sprint.endDate)
  const today = new Date()
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, totalDays - daysElapsed)

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F1F5F9] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Navigation */}
        <Link
          href="/admin/pm/goals"
          className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-[#F5B74D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Sprint Goals</span>
        </Link>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl font-mono text-[#64748B]">
              #{sprint.sprintNumber}
            </span>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(sprint.status)}`}>
              {sprint.status}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{sprint.name}</h1>
          <p className="text-[#94A3B8]">
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            {sprint.status === 'active' && ` • ${daysRemaining} days remaining`}
          </p>
        </div>

        {/* Sprint Goal */}
        {goalText && (
          <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-6">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">
              Sprint Goal
            </h2>
            <p className="text-[#F1F5F9] leading-relaxed whitespace-pre-wrap">
              {goalText}
            </p>
          </div>
        )}

        {/* Progress Summary */}
        <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-6">
          <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">
            Progress
          </h2>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <div className="text-xs text-[#64748B] mb-1">Total Stories</div>
              <div className="text-2xl font-bold text-[#F1F5F9]">{totalStories}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748B] mb-1">Completed</div>
              <div className="text-2xl font-bold text-[#34D399]">{completedStories.length}</div>
            </div>
            <div>
              <div className="text-xs text-[#64748B] mb-1">In Progress</div>
              <div className="text-2xl font-bold text-[#F5B74D]">{inProgressStories.length}</div>
            </div>
          </div>
          <ProgressBar value={completedStories.length} total={totalStories} />
        </div>

        {/* Stories */}
        {stories.length > 0 && (
          <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-6">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">
              Stories ({stories.length})
            </h2>
            <div className="space-y-3">
              {stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/admin/pm/stories/${story.slug}`}
                  className="block"
                >
                  <div className="bg-[#0B1120] border border-[#1E293B] rounded-lg p-4 hover:border-[#F5B74D]/30 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono text-[#64748B]">
                            {getStoryNumber(story.slug)}
                          </span>
                          <StatusBadge status={story.status} size="sm" />
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
              ))}
            </div>
          </div>
        )}

        {stories.length === 0 && (
          <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-12 text-center">
            <p className="text-[#64748B]">No stories in this sprint</p>
          </div>
        )}
      </div>
    </div>
  )
}