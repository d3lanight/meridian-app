import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SectionLabel } from '@/components/pm/SectionLabel'
import { EpicBadge, StatusBadge, statusConfig } from '@/components/pm/StatusBadge'
import { LexicalContent } from '@/components/pm/LexicalRenderer'

function extractEpicNumber(slug: string): string {
  const match = slug?.match(/ca-epic(\d+)/)
  return match ? match[1] : '?'
}

export default async function EpicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })

  let epic: any = null
  try {
    epic = await payload.findByID({
      collection: 'payload-epics',
      id: Number(id),
    })
  } catch {
    // not found
  }

  if (!epic) {
    return (
      <div className="px-[28px] py-10">
        <p className="font-body text-sm text-[#64748B]">Epic not found</p>
      </div>
    )
  }

  const storiesResult = await payload.find({
    collection: 'payload-stories',
    where: { epic: { equals: epic.id } },
    depth: 1,
    limit: 100,
    sort: 'id',
  })
  const stories = storiesResult.docs

  const epicNum = extractEpicNumber(epic.slug)
  const done = stories.filter((s: any) => s.status === 'done').length
  const total = stories.length
  const pct = total ? Math.round((done / total) * 100) : 0

  const sprintNumbers = stories
    .map((s: any) => {
      const sp = typeof s.sprint === 'object' ? s.sprint : null
      return sp?.sprint_number ? Number(sp.sprint_number) : null
    })
    .filter((n): n is number => n !== null)
  const minSprint = sprintNumbers.length ? Math.min(...sprintNumbers) : null
  const maxSprint = sprintNumbers.length ? Math.max(...sprintNumbers) : null

  const phases = [...new Set(stories.map((s: any) => s.phase).filter(Boolean))]

  const statusOrder: Record<string, number> = { 'in-progress': 0, 'sprint-ready': 1, 'needs-refinement': 2, 'done': 3, 'deferred': 4, 'cancelled': 5 }
  const sortedStories = [...stories].sort((a: any, b: any) =>
    (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
  )

  return (
    <div className="pb-10">
      <div style={{ padding: '24px 28px 20px' }}>
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/admin/pm"
            className="flex items-center justify-center shrink-0 no-underline"
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
          <span className="font-body text-xs text-[#64748B]">PM Dashboard</span>
          <span className="text-[#475569] text-[11px]">/</span>
          <span className="font-body text-xs text-[#64748B]">Epic Roadmap</span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-sm font-semibold text-[#F5B74D]">E{epicNum}</span>
          <EpicBadge status={epic.status} />
        </div>
        <h1
          className="font-display font-bold text-[#F1F5F9]"
          style={{ fontSize: 28, letterSpacing: '-0.02em', margin: 0 }}
        >
          {epic.name}
        </h1>
      </div>

      {epic.goal?.root?.children?.length > 0 && (
        <div style={{ padding: '0 28px 24px' }}>
          <SectionLabel>Goal</SectionLabel>
          <div style={{ background: '#131B2E', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(148,163,184,0.08)' }}>
            <LexicalContent content={epic.goal} />
          </div>
        </div>
      )}

      {total > 0 && (
        <div style={{ padding: '0 28px 24px' }}>
          <SectionLabel>Progress</SectionLabel>
          <div className="flex items-center gap-[14px]">
            <div className="flex-1 overflow-hidden" style={{ height: 8, background: '#1A2540', borderRadius: 4 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: epic.status === 'complete' ? '#34D399' : '#F5B74D', borderRadius: 4 }} />
            </div>
            <span className="font-mono text-sm font-semibold text-[#F5B74D]">{pct}%</span>
            <span className="font-mono text-xs text-[#64748B]">{done}/{total}</span>
          </div>
        </div>
      )}

      <div style={{ padding: '0 28px 24px' }}>
        <SectionLabel>Scope</SectionLabel>
        <div
          className="flex items-center flex-wrap gap-4"
          style={{ background: '#131B2E', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(148,163,184,0.08)' }}
        >
          {phases.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-[#64748B]">Phase:</span>
              <span className="font-mono text-xs font-semibold text-[#F1F5F9]">{phases.join(', ')}</span>
            </div>
          )}
          {minSprint !== null && (
            <>
              <span className="text-[#475569]">·</span>
              <div className="flex items-center gap-2">
                <span className="font-body text-xs text-[#64748B]">Sprints:</span>
                <span className="font-mono text-xs font-semibold text-[#F1F5F9]">
                  {minSprint === maxSprint ? `S${minSprint}` : `S${minSprint}–S${maxSprint}`}
                </span>
              </div>
            </>
          )}
          <span className="text-[#475569]">·</span>
          <div className="flex items-center gap-2">
            <span className="font-body text-xs text-[#64748B]">Stories:</span>
            <span className="font-mono text-xs font-semibold text-[#F1F5F9]">{total}</span>
          </div>
        </div>
      </div>

      {epic.scope_in?.root?.children?.length > 0 && (
        <div style={{ padding: '0 28px 24px' }}>
          <SectionLabel>Scope In</SectionLabel>
          <div style={{ background: '#131B2E', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(148,163,184,0.08)' }}>
            <LexicalContent content={epic.scope_in} />
          </div>
        </div>
      )}

      {epic.scope_out?.root?.children?.length > 0 && (
        <div style={{ padding: '0 28px 24px' }}>
          <SectionLabel>Scope Out</SectionLabel>
          <div style={{ background: '#131B2E', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(148,163,184,0.08)' }}>
            <LexicalContent content={epic.scope_out} />
          </div>
        </div>
      )}

      {total > 0 && (
        <div style={{ padding: '0 28px 32px' }}>
          <SectionLabel>Stories</SectionLabel>
          <div className="flex flex-col gap-2">
            {sortedStories.map((s: any) => {
              const cfg = statusConfig[s.status]
              return (
                <Link
                  key={s.id}
                  href={`/admin/pm/stories/${s.slug}`}
                  className="flex items-center justify-between no-underline transition-colors"
                  style={{
                    background: '#131B2E',
                    borderRadius: 10,
                    padding: '12px 16px',
                    border: '1px solid rgba(148,163,184,0.08)',
                    borderLeft: `3px solid ${cfg?.color || '#64748B'}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-[#64748B]">#{s.id}</span>
                    <span className="font-body text-[13px] font-semibold text-[#F1F5F9]">{s.name}</span>
                  </div>
                  <StatusBadge status={s.status} size="small" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
