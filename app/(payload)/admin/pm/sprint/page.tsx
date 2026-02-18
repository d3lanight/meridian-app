import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Target, Calendar } from 'lucide-react'
import { SectionLabel } from '@/components/pm/SectionLabel'
import { StatusBadge, SprintBadge, statusConfig } from '@/components/pm/StatusBadge'
import { ComplexityDots } from '@/components/pm/ComplexityDots'

function effortLabel(e: string) {
  return e?.replace(/-/g, ' ').replace('plus', '+') || '—'
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return d.slice(5, 10)
}

export default async function SprintDashboardPage() {
  const payload = await getPayload({ config })

  const sprintResult = await payload.find({
    collection: 'payload-sprints',
    where: { status: { equals: 'active' } },
    limit: 1,
  })
  const sprint = sprintResult.docs[0]

  if (!sprint) {
    return (
      <div className="px-[28px] py-10">
        <p className="font-body text-sm text-[#64748B]">No active sprint</p>
      </div>
    )
  }

  const storiesResult = await payload.find({
    collection: 'payload-stories',
    where: { sprint: { equals: sprint.id } },
    depth: 1,
    limit: 100,
    sort: 'id',
  })
  const stories = storiesResult.docs

  const completed = stories.filter((s: any) => s.status === 'done').length
  const total = stories.length
  const pct = total ? Math.round((completed / total) * 100) : 0
  const activeStories = stories.filter((s: any) => s.status !== 'done' && s.status !== 'deferred' && s.status !== 'cancelled')

  const epicIds = new Set(stories.map((s: any) => typeof s.epic === 'object' ? s.epic?.id : s.epic).filter(Boolean))

  const statusOrder = ['done', 'in-progress', 'sprint-ready', 'needs-refinement', 'deferred', 'cancelled'] as const
  const statusCounts = statusOrder.map(status => ({
    status,
    count: stories.filter((s: any) => s.status === status).length,
  })).filter(s => s.count > 0)






  const phaseResult = await payload.find({
    collection: 'payload-phases',
    where: { status: { equals: 'active' } },
    depth: 0,
    limit: 20,
  })
  const activeStage = phaseResult.docs.find((p: any) => p.stage_number != null)

  return (
    <div className="pb-10">
      <div style={{ padding: '32px 28px 24px' }}>
        <div className="flex items-center gap-2 mb-1">
          <Target size={16} className="text-[#F5B74D]" />
          <span className="font-mono text-[11px] text-[#F5B74D] font-semibold uppercase tracking-[0.1em]">
            Sprint {sprint.sprint_number}
          </span>
          <SprintBadge status={sprint.status} />
        </div>
        <h1 className="font-display font-bold text-[#F1F5F9]" style={{ fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          {sprint.name}
        </h1>
        <div className="flex items-center gap-2 font-body text-xs text-[#64748B]">
          <Calendar size={12} />
          <span>{formatDate(sprint.start_date)} → {formatDate(sprint.end_date)}</span>
          {activeStage && (
            <>
              <span className="text-[#475569]">·</span>
              <span className="font-mono uppercase font-semibold" style={{ fontSize: 10, letterSpacing: '0.06em', color: '#60A5FA', background: 'rgba(96,165,250,0.12)', padding: '2px 8px', borderRadius: 10 }}>
                Stage {activeStage.phase_number}.{activeStage.stage_number}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto" style={{ padding: '0 28px 24px' }}>
        {[
          { label: 'Progress', value: `${pct}%`, sub: `${completed} of ${total} stories`, color: '#F5B74D' },
          { label: 'Stage', value: activeStage ? `${activeStage.phase_number}.${activeStage.stage_number}` : '—', sub: activeStage?.name || '—', color: '#60A5FA' },
          { label: 'Epics', value: String(epicIds.size), sub: 'across sprint', color: '#A78BFA' },
          { label: 'Active', value: String(activeStories.length), sub: 'stories remaining', color: '#F1F5F9' },
        ].map(c => (
          <div key={c.label} className="flex-1 min-w-[140px]" style={{ background: '#131B2E', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 16, padding: '18px 20px' }}>
            <div className="font-body text-[10px] tracking-[0.08em] text-[#64748B] uppercase font-semibold mb-2">{c.label}</div>
            <div className="font-mono text-2xl font-semibold" style={{ color: c.color }}>{c.value}</div>
            <div className="font-body text-[11px] text-[#64748B] mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 28px 24px' }}>
        <SectionLabel>Progress</SectionLabel>
        <div className="flex gap-[3px] overflow-hidden" style={{ height: 8, borderRadius: 4 }}>
          {statusCounts.map(({ status, count }) => (
            <div key={status} style={{ width: `${(count / total) * 100}%`, background: statusConfig[status]?.color || '#64748B' }} />
          ))}
        </div>
        <div className="flex gap-[14px] mt-2 flex-wrap">
          {statusCounts.map(({ status, count }) => {
            const cfg = statusConfig[status]
            return (
              <span key={status} className="flex items-center gap-[5px] text-[10px] text-[#64748B]">
                <span className="block rounded-sm" style={{ width: 8, height: 8, background: cfg?.color || '#64748B' }} />
                {cfg?.label || status} ({count})
              </span>
            )
          })}
        </div>
      </div>

      {sprint.goal?.root?.children?.length > 0 && (
        <div style={{ padding: '0 28px 24px' }}>
          <SectionLabel>Goal</SectionLabel>
          <div style={{ background: '#131B2E', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(148,163,184,0.08)' }}>
            {sprint.goal.root.children.map((node: any, i: number) => {
              const text = (node.children || []).map((c: any) => c.text || '').join('')
              return text ? (
                <p key={i} className="font-body text-sm text-[#94A3B8] leading-[1.7] m-0 mb-2 last:mb-0">{text}</p>
              ) : null
            })}
          </div>
        </div>
      )}

      {activeStories.length > 0 && (
        <div style={{ padding: '0 28px 24px' }}>
          <SectionLabel>Active Stories</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeStories
              .sort((a: any, b: any) => {
                const order: Record<string, number> = { 'in-progress': 0, 'sprint-ready': 1, 'needs-refinement': 2 }
                return (order[a.status] ?? 9) - (order[b.status] ?? 9)
              })
              .map((s: any) => {
                const sEpic = typeof s.epic === 'object' ? s.epic : null
                return (
                  <Link key={s.id} href={`/admin/pm/stories/${s.slug}`} className="block no-underline transition-colors" style={{ background: '#131B2E', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(148,163,184,0.08)' }}>
                    <div className="flex justify-between items-start mb-[10px]">
                      <div className="flex flex-col gap-[3px] flex-1">
                        <span className="font-mono text-[10px] text-[#64748B] font-medium">#{s.id}</span>
                        <span className="font-body text-sm font-semibold text-[#F1F5F9] leading-[1.3]">{s.name}</span>
                      </div>
                      <StatusBadge status={s.status} size="small" />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                      <ComplexityDots level={s.complexity} />
                      {sEpic && <span>{sEpic.name}</span>}
                    </div>
                  </Link>
                )
              })}
          </div>
        </div>
      )}

      <div style={{ padding: '0 28px 32px' }}>
        <div className="flex items-center justify-between" style={{ background: '#131B2E', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(148,163,184,0.08)' }}>
          <div className="flex gap-4 text-xs text-[#64748B]">
            <span className="flex items-center gap-[5px]">
              <span className="block w-2 h-2 rounded-full bg-[#34D399]" />
              {completed} completed
            </span>
            <span className="flex items-center gap-[5px]">
              <span className="block w-2 h-2 rounded-full bg-[#F87171]" />
              {stories.filter((s: any) => s.status === 'deferred' || s.status === 'cancelled').length} deferred
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#475569]">{total} total</span>
        </div>
      </div>
    </div>
  )
}
