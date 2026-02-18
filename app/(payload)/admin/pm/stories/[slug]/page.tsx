/**
 * Story Detail Page
 * Version: 1.2 (locked sections + AC field)
 * Story: curator-initiated structural fix
 *
 * Changelog:
 * v1.2 — Locked 8-section content parser (Pre-work + Post-work groups),
 *         AC reads from acceptanceCriteria field (not content checkboxes),
 *         Story type updated with acceptanceCriteria field.
 * v1.1 — Cached queries, full story view.
 * v1.0 — Initial story detail (ca-story31-sprint-dashboard).
 */

import configPromise from '@payload-config'
import { cachedFind, cachedFindByID } from '@/lib/payloadCache'
import { StatusBadge } from '@/components/pm/StatusBadge'
import { ComplexityDots } from '@/components/pm/ComplexityDots'
import { CheckCircle2, Circle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
  content?: any
  acceptanceCriteria?: any  // Lexical rich text (v1.2)
  dependency_1?: string
  dependency_2?: string
}

type Sprint = {
  id: string
  name: string
  sprintNumber: number | string
  startDate: string
  endDate: string
}

type Epic = {
  id: string
  name: string
  slug: string
}

// Extract plain text from Lexical JSON - improved version
function extractText(lexical: any): string {
  if (!lexical?.root?.children) return ''
  
  function processNode(node: any): string {
    // Handle text nodes
    if (node.text) return node.text
    
    // Handle heading nodes
    if (node.type === 'heading' && node.children) {
      const text = node.children.map(processNode).join('')
      return `\n## ${text}\n`
    }
    
    // Handle paragraph nodes
    if (node.type === 'paragraph' && node.children) {
      return node.children.map(processNode).join('') + '\n\n'
    }
    
    // Handle list items
    if (node.type === 'listitem' && node.children) {
      return '- ' + node.children.map(processNode).join('') + '\n'
    }
    
    // Handle any node with children
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

// Extract section content between headers
function extractSection(text: string, sectionName: string): string {
  const lines = text.split('\n')
  const startIndex = lines.findIndex(line => line.trim() === `## ${sectionName}`)
  if (startIndex === -1) return ''
  
  const endIndex = lines.findIndex((line, i) => i > startIndex && line.startsWith('## '))
  const sectionLines = endIndex === -1 
    ? lines.slice(startIndex + 1)
    : lines.slice(startIndex + 1, endIndex)
  
  return sectionLines.join('\n').trim()
}

// ─── Section Definitions (v1.2 locked) ───────────────────────────────────────

const PRE_WORK_SECTIONS = ['Problem', 'Approach', 'Dependencies'] as const
const POST_WORK_SECTIONS = [
  'Outcome',
  'What Was Delivered',
  'Files Changed',
  'What Was Skipped',
  'Quality Pass',
] as const

// ─── AC Parser (v1.2) — reads acceptanceCriteria field ───────────────────────

type ACItem = { checked: boolean; text: string }

function parseAcceptanceCriteria(acField: any): ACItem[] {
  if (!acField) return []
  const text = extractText(acField)
  const matches = text.match(/- \[([ x])\] (.+)/g) || []
  return matches.map(m => ({
    checked: m[3] === 'x',
    text: m.replace(/- \[[ x]\] /, '').trim(),
  }))
}

// ─── Section Group Renderer ───────────────────────────────────────────────────

function SectionGroup({
  label,
  sections,
  contentText,
}: {
  label: string
  sections: readonly string[]
  contentText: string
}) {
  const rendered = sections
    .map(name => ({ name, body: extractSection(contentText, name) }))
    .filter(s => s.body !== '')

  if (rendered.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
          {label}
        </span>
        <div className="flex-1 h-px bg-[#1E293B]" />
      </div>
      {rendered.map(s => (
        <div key={s.name}>
          <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">
            {s.name}
          </h2>
          <div className="text-[#F1F5F9] leading-relaxed whitespace-pre-wrap">
            {s.body}
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Get story (cached)
  const storyResult = await cachedFind(
    configPromise,
    {
      collection: 'payload-stories',
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
    },
    CACHE_TIME,
    ['story-detail']
  )

  const story = storyResult.docs[0] as Story | undefined
  if (!story) notFound()

  // Get related data (cached)
  const [sprintData, epicData, allStoriesResult] = await Promise.all([
    story.sprint ? cachedFindByID(
      configPromise,
      'payload-sprints',
      story.sprint,
      CACHE_TIME
    ) : null,
    story.epic ? cachedFindByID(
      configPromise,
      'payload-epics',
      story.epic,
      CACHE_TIME
    ) : null,
    cachedFind(
      configPromise,
      {
        collection: 'payload-stories',
        depth: 0,
        limit: 200,
      },
      CACHE_TIME,
      ['story-detail']
    ),
  ])

  const sprint = sprintData as Sprint | null
  const epic = epicData as Epic | null
  const allStories = allStoriesResult.docs as Story[]

  // Get dependency stories
  const dep1 = story.dependency_1 ? allStories.find(s => s.id === story.dependency_1) : null
  const dep2 = story.dependency_2 ? allStories.find(s => s.id === story.dependency_2) : null

  // Extract content text for section parsing
  const contentText = extractText(story.content)

  // v1.2: AC from dedicated field
  const acceptanceCriteria = parseAcceptanceCriteria(story.acceptanceCriteria)
  const acProgress = acceptanceCriteria.filter(ac => ac.checked).length

  // Section visibility
  const hasPreWork = PRE_WORK_SECTIONS.some(s => extractSection(contentText, s) !== '')
  const hasPostWork = POST_WORK_SECTIONS.some(s => extractSection(contentText, s) !== '')

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F1F5F9] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Navigation */}
        <Link
          href="/admin/pm/stories"
          className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-[#F5B74D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Story Board</span>
        </Link>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg font-mono text-[#64748B]">
              {getStoryNumber(story.slug)}
            </span>
            <StatusBadge status={story.status} />
          </div>
          <h1 className="text-3xl font-bold mb-4">{story.name}</h1>
        </div>

        {/* Properties Grid */}
        <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-6">
          <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">
            Properties
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {epic && (
              <div>
                <div className="text-xs text-[#64748B] mb-1">Epic</div>
                <div className="text-sm text-[#A78BFA]">{epic.name}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-[#64748B] mb-1">Complexity</div>
              <ComplexityDots level={story.complexity} />
            </div>
            <div>
              <div className="text-xs text-[#64748B] mb-1">Effort</div>
              <div className="text-sm text-[#F1F5F9] font-mono">{story.effort}</div>
            </div>
          </div>
        </div>

        {/* Sprint Context */}
        {sprint && (
          <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#64748B]">S{sprint.sprintNumber || '?'}</span>
                <span className="text-sm text-[#94A3B8]">{sprint.name}</span>
              </div>
              <span className="text-xs text-[#64748B]">
                {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Acceptance Criteria */}
        {acceptanceCriteria.length > 0 && (
          <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">
                Acceptance Criteria
              </h2>
              <span className="text-sm text-[#64748B]">
                {acProgress} / {acceptanceCriteria.length}
              </span>
            </div>
            <div className="space-y-3">
              {acceptanceCriteria.map((ac, i) => (
                <div key={i} className="flex items-start gap-3">
                  {ac.checked ? (
                    <CheckCircle2 className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#64748B] flex-shrink-0 mt-0.5" />
                  )}
                  <span className={ac.checked ? 'text-[#94A3B8]' : 'text-[#F1F5F9]'}>
                    {ac.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {(dep1 || dep2) && (
          <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-6">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-4">
              Dependencies
            </h2>
            <div className="flex gap-2">
              {dep1 && (
                <Link href={`/admin/pm/stories/${dep1.slug}`}>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] rounded text-sm hover:bg-[#F5B74D]/10 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                    {getStoryNumber(dep1.slug)} {dep1.name}
                  </span>
                </Link>
              )}
              {dep2 && (
                <Link href={`/admin/pm/stories/${dep2.slug}`}>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] rounded text-sm hover:bg-[#F5B74D]/10 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                    {getStoryNumber(dep2.slug)} {dep2.name}
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Content Sections — Pre-work + Post-work groups */}
        {(hasPreWork || hasPostWork) && (
          <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg p-6 space-y-8">
            <SectionGroup
              label="Pre-work"
              sections={PRE_WORK_SECTIONS}
              contentText={contentText}
            />
            {hasPreWork && hasPostWork && (
              <div className="h-px bg-[#1E293B]" />
            )}
            <SectionGroup
              label="Post-work"
              sections={POST_WORK_SECTIONS}
              contentText={contentText}
            />
          </div>
        )}

      </div>
    </div>
  )
}
