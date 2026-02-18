import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { ArrowLeft, Calendar, Target } from 'lucide-react'
import { SectionLabel } from '@/components/pm/SectionLabel'
import { StatusBadge, SprintBadge, statusConfig } from '@/components/pm/StatusBadge'

function formatDate(d: string | null) {
  if (!d) return '—'
  return d.slice(5, 10)
}

export default async function SprintGoalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'payload-sprints',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const sprint = result.docs[0]

  if (!sprint) {
    return (
      <div className="px-[28px] py-10">
        <p className="font-body text-sm text-[#64748B]">Sprint not found</p>
      </div>
    )
  }

  const storiesResult = await payload.find({
    collection: 'payload-stories',
    where: { sprint: { equals: sprint.id } },
    depth: 0,
    limit: 100,
    sort: 'id',
  })
  const stories = storiesResult.docs
  const completed = stories.filter((s: any) => s.status === 'done').length
  const total = stories.length
  const pct = total ? Math.round((completed / total) * 100) : 0

  return (
    <div className="pb-10">
      <div style={{ padding: '24px 28px 20px' }}>
        <div className="flex items-center gap-3 mb-3">
          <Link href="/admin/pm/sprint" className="flex items-center justify-center shrink-0 no-underline" style={{ width: 32, height: 32, background: '#131B2E', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 8, color: '#94A3B8' }}>
            <ArrowLeft size={14} />
          </Link>
          <span className="font-body text-xs text-[#64748B]">Sprint</span>
          <span className="text-[#475569] text-[11px]">/</span>
          <span className="font-mono text-xs font-semibold text-[#F5B74D]">Sprint {sprint.sprint_number}</span>
          <SprintBadge status={sprint.status} />
        </div>
        <h1 className="font-display font-bold text-[#F1F5F9]" style={{ fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
          {sprint.name}
        </h1>
        <div className="flex items-center gap-2 font-body text-xs text-[#64748B]">
          <Calendar size={12} />
          <span>{formatDate(sprint.start_date)} → {formatDate(sprint.end_date)}</span>
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

      <div style={{ padding: '0 28px 24px' }}>
        <SectionLabel>Progress</SectionLabel>
        <div className="flex items-center gap-[14px]">
          <div className="flex-1 overflow-hidden" style={{ height: 8, background: '#1A2540', borderRadius: 4 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: sprint.status === 'completed' ? '#34D399' : '#F5B74D', borderRadius: 4 }} />
          </div>
          <span className="font-mono text-sm font-semibold text-[#F5B74D]">{pct}%</span>
          <span className="font-mono text-xs text-[#64748B]">{completed}/{total}</span>
        </div>
      </div>

      <div style={{ padding: '0 28px 32px' }}>
        <SectionLabel>Stories</SectionLabel>
        <div className="flex flex-col gap-2">
          {stories.map((s: any) => {
            const cfg = statusConfig[s.status]
            return (
              <Link key={s.id} href={`/admin/pm/stories/${s.slug}`} className="flex items-center justify-between no-underline transition-colors" style={{ background: '#131B2E', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(148,163,184,0.08)', borderLeft: `3px solid ${cfg?.color || '#64748B'}` }}>
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
    </div>
  )
}
