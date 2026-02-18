import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SectionLabel } from '@/components/pm/SectionLabel'
import { PhaseBadge, EpicBadge, statusConfig } from '@/components/pm/StatusBadge'
import { LexicalContent } from '@/components/pm/LexicalRenderer'

const categoryConfig: Record<string, { color: string; bg: string }> = {
  'concept':        { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  'how-to':         { color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  'reference':      { color: '#F5B74D', bg: 'rgba(245,183,77,0.12)' },
  'glossary':       { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  'phase-overview': { color: '#F5B74D', bg: 'rgba(245,183,77,0.12)' },
  'milestone':      { color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  'standard':       { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' },
  'release-note':   { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  'help-article':   { color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  'faq':            { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  'roadmap':        { color: '#F5B74D', bg: 'rgba(245,183,77,0.12)' },
}

const stageStatusConfig: Record<string, { color: string }> = {
  'complete': { color: '#34D399' },
  'active':   { color: '#F5B74D' },
  'planned':  { color: '#94A3B8' },
}

function extractEpicNumber(slug: string): string {
  const match = slug?.match(/ca-epic(\d+)/)
  return match ? match[1] : '?'
}

export default async function PhaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await params
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, Number(pageParam) || 1)
  const perPage = 10

  const payload = await getPayload({ config })

  let phase: any = null
  try {
    phase = await payload.findByID({
      collection: 'payload-phases',
      id: Number(id),
    })
  } catch {
    // not found
  }

  if (!phase) {
    return (
      <div className="px-[28px] py-10">
        <p className="font-body text-sm text-[#64748B]">Phase not found</p>
      </div>
    )
  }

  const isParentPhase = !phase.stage_number
  const phaseNum = String(phase.phase_number)

  let stages: any[] = []
  if (isParentPhase) {
    const stagesResult = await payload.find({
      collection: 'payload-phases',
      where: { parent_phase: { equals: phase.id } },
      limit: 20,
      sort: 'stage_number',
    })
    stages = stagesResult.docs
  }

  const overviewResult = await payload.find({
    collection: 'payload-knowledge-entries',
    where: {
      phase: { equals: phaseNum },
      category: { equals: 'phase-overview' },
    },
    limit: 1,
  })
  const overviewEntry = overviewResult.docs[0]

  const storiesForPhase = await payload.find({
    collection: 'payload-stories',
    where: { phase: { equals: phaseNum } },
    depth: 1,
    limit: 200,
    sort: 'id',
  })

  const epicMap = new Map<number, any>()
  for (const s of storiesForPhase.docs as any[]) {
    const epic = typeof s.epic === 'object' ? s.epic : null
    if (epic && !epicMap.has(epic.id)) {
      epicMap.set(epic.id, epic)
    }
  }
  const relatedEpics = Array.from(epicMap.values()).sort((a, b) => a.id - b.id)

  const totalStories = storiesForPhase.docs.length
  const doneStories = (storiesForPhase.docs as any[]).filter(s => s.status === 'done').length

  const knowledgeResult = await payload.find({
    collection: 'payload-knowledge-entries',
    where: { phase: { equals: phaseNum } },
    limit: perPage,
    page: currentPage,
    sort: 'category',
  })
  const knowledgeEntries = knowledgeResult.docs
  const totalKnowledge = knowledgeResult.totalDocs
  const totalPages = knowledgeResult.totalPages

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
        </div>

        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-sm font-semibold text-[#F5B74D]">Phase {phaseNum}</span>
          <PhaseBadge status={phase.status} />
        </div>
        <h1
          className="font-display font-bold text-[#F1F5F9]"
          style={{ fontSize: 28, letterSpacing: '-0.02em', margin: 0 }}
        >
          {phase.name}
        </h1>
      </div>

      {(overviewEntry?.content?.root?.children?.length > 0 || phase.goal?.root?.children?.length > 0) && (
        <div style={{ padding: '0 28px 24px' }}>
          <SectionLabel>Overview</SectionLabel>
          <div style={{ background: '#131B2E', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(148,163,184,0.08)' }}>
            <LexicalContent content={overviewEntry?.content || phase.goal} />
          </div>
        </div>
      )}

      {stages.length > 0 && (
        <div style={{ padding: '0 28px 24px' }}>
          <SectionLabel>Stages</SectionLabel>
          <div style={{ background: '#131B2E', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.08)' }}>
            {stages.map((stage: any, i: number) => {
              const isActive = stage.status === 'active'
              return (
                <div
                  key={stage.id}
                  className="flex items-center justify-between"
                  style={{
                    padding: '14px 18px',
                    borderTop: i > 0 ? '1px solid rgba(148,163,184,0.08)' : undefined,
                    borderLeft: isActive ? '3px solid #F5B74D' : '3px solid transparent',
                    background: isActive ? '#1A2540' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#64748B] font-medium min-w-[28px]">
                      {stage.phase_number}.{stage.stage_number}
                    </span>
                    <span
                      className="font-body text-sm"
                      style={{
                        color: isActive ? '#F1F5F9' : '#94A3B8',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {stage.name}
                    </span>
                  </div>
                  <PhaseBadge status={stage.status} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ padding: '0 28px 24px' }}>
        <SectionLabel>Metrics</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <div style={{ background: '#131B2E', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 16, padding: '18px 20px' }}>
            <div className="font-body text-[10px] tracking-[0.08em] text-[#64748B] uppercase font-semibold mb-2">Epics</div>
            <div className="font-mono text-2xl font-semibold text-[#A78BFA]">{relatedEpics.length}</div>
            <div className="font-body text-[11px] text-[#64748B] mt-1">
              {relatedEpics.filter(e => e.status === 'active' || e.status === 'in-refinement').length} active
            </div>
          </div>
          <div style={{ background: '#131B2E', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 16, padding: '18px 20px' }}>
            <div className="font-body text-[10px] tracking-[0.08em] text-[#64748B] uppercase font-semibold mb-2">Stories</div>
            <div className="font-mono text-2xl font-semibold text-[#60A5FA]">{totalStories}</div>
            <div className="font-body text-[11px] text-[#64748B] mt-1">{doneStories} done</div>
          </div>
        </div>
      </div>

      {relatedEpics.length > 0 && (
        <div style={{ padding: '0 28px 24px' }}>
          <SectionLabel>Related Epics</SectionLabel>
          <div className="flex flex-col gap-2">
            {relatedEpics.map((epic: any) => (
              <Link
                key={epic.id}
                href={`/admin/pm/epics/${epic.id}`}
                className="flex items-center justify-between no-underline transition-colors"
                style={{
                  background: '#131B2E',
                  borderRadius: 10,
                  padding: '12px 16px',
                  border: '1px solid rgba(148,163,184,0.08)',
                  borderLeft: `3px solid ${epic.status === 'active' ? '#F5B74D' : epic.status === 'complete' ? '#34D399' : '#94A3B8'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#64748B]">E{extractEpicNumber(epic.slug)}</span>
                  <span className="font-body text-[13px] font-semibold text-[#F1F5F9]">{epic.name}</span>
                </div>
                <EpicBadge status={epic.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {totalKnowledge > 0 && (
        <div style={{ padding: '0 28px 32px' }}>
          <SectionLabel>Knowledge ({totalKnowledge})</SectionLabel>
          <div style={{ background: '#131B2E', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.08)' }}>
            {knowledgeEntries.map((entry: any, i: number) => {
              const catCfg = categoryConfig[entry.category] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' }
              return (
                <Link
                  key={entry.id}
                  href={`/admin/pm/knowledge/${entry.id}`}
                  className="flex items-center justify-between no-underline transition-colors"
                  style={{
                    padding: '12px 18px',
                    borderTop: i > 0 ? '1px solid rgba(148,163,184,0.08)' : undefined,
                  }}
                >
                  <span className="font-body text-sm text-[#F1F5F9]">{entry.title}</span>
                  <span
                    className="font-mono uppercase font-semibold shrink-0"
                    style={{
                      fontSize: 10, letterSpacing: '0.06em',
                      color: catCfg.color, background: catCfg.bg,
                      padding: '2px 8px', borderRadius: 10,
                    }}
                  >
                    {entry.category?.replace('-', ' ')}
                  </span>
                </Link>
              )
            })}

            {totalPages > 1 && (
              <div
                className="flex items-center justify-center gap-3"
                style={{ padding: '12px 18px', borderTop: '1px solid rgba(148,163,184,0.08)' }}
              >
                {currentPage > 1 && (
                  <Link href={`/admin/pm/phases/${id}?page=${currentPage - 1}`} className="font-body text-xs text-[#F5B74D] no-underline">
                    ← Prev
                  </Link>
                )}
                <span className="font-mono text-xs text-[#64748B]">Page {currentPage} of {totalPages}</span>
                {currentPage < totalPages && (
                  <Link href={`/admin/pm/phases/${id}?page=${currentPage + 1}`} className="font-body text-xs text-[#F5B74D] no-underline">
                    Next →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
