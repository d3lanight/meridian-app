import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { ArrowLeft, Target, Calendar, Layers, Clock } from 'lucide-react'
import { CheckCircle2, Circle } from 'lucide-react'
import { SectionLabel } from '@/components/pm/SectionLabel'
import { StatusBadge } from '@/components/pm/StatusBadge'
import { ComplexityDots } from '@/components/pm/ComplexityDots'
import { splitContentSections, LexicalNodes, extractACItems } from '@/components/pm/LexicalRenderer'

function effortLabel(e: string) {
  return e?.replace(/-/g, ' ').replace('plus', '+') || '—'
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return d.slice(5, 10)
}

export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'payload-stories',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })

  const story = result.docs[0]
  if (!story) {
    return (
      <div className="px-[28px] py-10">
        <p className="font-body text-sm text-[#64748B]">Story not found</p>
      </div>
    )
  }

  const epic = typeof story.epic === 'object' ? story.epic : null
  const sprint = typeof story.sprint === 'object' ? story.sprint : null
  const storyNumber = story.id
  const epicNumber = epic?.slug ? (epic.slug.match(/ca-epic(\d+)/)?.[1] || '?') : '?'
  const sections = splitContentSections(story.content)
  const acItems = extractACItems(story.acceptance_criteria)
  const acDone = acItems.filter(item => item.done).length

  return (
    <div className="pb-10">
      <div style={{ padding: '24px 28px 20px' }}>
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/admin/pm/stories"
            className="flex items-center justify-center shrink-0 no-underline transition-colors"
            style={{
              width: 32, height: 32,
              background: '#131B2E',
              border: '1px solid rgba(148,163,184,0.08)',
              borderRadius: 8,
              color: '#94A3B8',
            }}
          >
            <ArrowLeft size={14} />
          </Link>
          <span className="font-body text-xs text-[#64748B]">Story Board</span>
          <span className="text-[#475569] text-[11px]">/</span>
          <span className="font-mono text-xs font-semibold text-[#F5B74D]">#{storyNumber}</span>
          <StatusBadge status={story.status} size="small" />
        </div>
        <h1
          className="font-display font-bold text-[#F1F5F9]"
          style={{ fontSize: 28, letterSpacing: '-0.02em', margin: 0 }}
        >
          {story.name}
        </h1>
      </div>

      <div style={{ padding: '0 28px 24px' }}>
        <div className="grid grid-cols-3 gap-3">
          <div style={{ background: '#131B2E', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(148,163,184,0.08)' }}>
            <div className="flex items-center gap-[5px] mb-2">
              <Layers size={12} className="text-[#64748B]" />
              <span className="font-body text-[10px] tracking-[0.08em] text-[#64748B] uppercase font-semibold">Epic</span>
            </div>
            <span className="font-body text-sm font-semibold text-[#A78BFA]">
              {epic ? `E${epicNumber} ${epic.name}` : '—'}
            </span>
          </div>
          <div style={{ background: '#131B2E', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(148,163,184,0.08)' }}>
            <div className="flex items-center gap-[5px] mb-2">
              <Target size={12} className="text-[#64748B]" />
              <span className="font-body text-[10px] tracking-[0.08em] text-[#64748B] uppercase font-semibold">Complexity</span>
            </div>
            <div className="flex items-center gap-2">
              <ComplexityDots level={story.complexity} />
              <span className="font-body text-sm font-semibold text-[#F5B74D]">
                {story.complexity.charAt(0).toUpperCase() + story.complexity.slice(1)}
              </span>
            </div>
          </div>
          <div style={{ background: '#131B2E', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(148,163,184,0.08)' }}>
            <div className="flex items-center gap-[5px] mb-2">
              <Clock size={12} className="text-[#64748B]" />
              <span className="font-body text-[10px] tracking-[0.08em] text-[#64748B] uppercase font-semibold">Effort</span>
            </div>
            <span className="font-body text-sm font-semibold text-[#94A3B8]">{effortLabel(story.effort)}</span>
          </div>
        </div>
      </div>

      {sprint && (
        <div style={{ padding: '0 28px 24px' }}>
          <div
            className="flex items-center flex-wrap gap-4"
            style={{ background: '#131B2E', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(148,163,184,0.08)' }}
          >
            <div className="flex items-center gap-[6px]">
              <Target size={13} className="text-[#F5B74D]" />
              <span className="font-body text-xs text-[#94A3B8]">Sprint {sprint.sprint_number}</span>
            </div>
            <span className="text-[#475569]">·</span>
            <span className="font-body text-xs text-[#64748B] flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(sprint.start_date)} → {formatDate(sprint.end_date)}
            </span>
            {story.phase && (
              <>
                <span className="text-[#475569]">·</span>
                <span
                  className="font-mono uppercase font-semibold"
                  style={{ fontSize: 10, letterSpacing: '0.06em', color: '#60A5FA', background: 'rgba(96,165,250,0.12)', padding: '2px 8px', borderRadius: 10 }}
                >
                  Phase {story.phase}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {sections.map((section, i) => (
        <div key={i} style={{ padding: '0 28px 24px' }}>
          {section.title && <SectionLabel>{section.title}</SectionLabel>}
          <div style={{ background: '#131B2E', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(148,163,184,0.08)' }}>
            <LexicalNodes nodes={section.nodes} />
          </div>
        </div>
      ))}

      {acItems.length > 0 && (
        <div style={{ padding: '0 28px 24px' }}>
          <SectionLabel>Acceptance Criteria</SectionLabel>
          <div style={{ background: '#131B2E', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.08)' }}>
            <div className="flex items-center justify-between" style={{ padding: '12px 18px', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <span className="font-body text-xs text-[#94A3B8]">{acDone} of {acItems.length} met</span>
              <div className="overflow-hidden" style={{ width: 80, height: 4, background: '#1A2540', borderRadius: 2 }}>
                <div style={{ width: `${acItems.length ? (acDone / acItems.length) * 100 : 0}%`, height: '100%', background: '#34D399', borderRadius: 2 }} />
              </div>
            </div>
            {acItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-[10px]" style={{ padding: '12px 18px', borderTop: idx > 0 ? '1px solid rgba(148,163,184,0.08)' : undefined }}>
                {item.done ? (
                  <CheckCircle2 size={16} className="shrink-0 text-[#34D399] mt-[1px]" />
                ) : (
                  <Circle size={16} className="shrink-0 text-[#475569] mt-[1px]" />
                )}
                <span className="font-body" style={{ fontSize: 13, color: item.done ? '#94A3B8' : '#F1F5F9', textDecoration: item.done ? 'line-through' : 'none', opacity: item.done ? 0.7 : 1, lineHeight: 1.5 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {story.notes?.root?.children?.length > 0 && (
        <div style={{ padding: '0 28px 32px' }}>
          <SectionLabel>Notes</SectionLabel>
          <div style={{ background: '#131B2E', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(148,163,184,0.08)' }}>
            <LexicalNodes nodes={story.notes.root.children} />
          </div>
        </div>
      )}
    </div>
  )
}
