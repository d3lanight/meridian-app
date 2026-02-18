import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { SectionLabel } from '@/components/pm/SectionLabel'
import { StatusBadge, statusConfig } from '@/components/pm/StatusBadge'
import { ComplexityDots } from '@/components/pm/ComplexityDots'

function effortLabel(e: string) {
  return e?.replace(/-/g, ' ').replace('plus', '+') || '—'
}

const statusOrder = ['in-progress', 'sprint-ready', 'needs-refinement', 'done', 'deferred', 'cancelled']

export default async function StoryBoardPage() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'payload-stories',
    depth: 1,
    limit: 200,
    sort: '-id',
  })
  const stories = result.docs

  const groups = statusOrder
    .map(status => ({
      status,
      items: stories.filter((s: any) => s.status === status),
    }))
    .filter(g => g.items.length > 0)

  return (
    <div className="pb-10">
      <div className="flex justify-between items-start" style={{ padding: '28px 28px 20px' }}>
        <div>
          <h1 className="font-display font-bold text-[#F1F5F9]" style={{ fontSize: 24, letterSpacing: '-0.02em', margin: 0 }}>
            Story Board
          </h1>
        </div>
        <span className="font-mono text-xs text-[#64748B]">{stories.length} stories</span>
      </div>

      <div className="flex flex-col gap-6" style={{ padding: '0 28px 32px' }}>
        {groups.map(group => {
          const cfg = statusConfig[group.status]
          if (!cfg) return null

          return (
            <div key={group.status}>
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-sm" style={{ width: 3, height: 16, background: cfg.color }} />
                <span className="font-body text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                <span className="font-mono text-[11px] text-[#64748B]">{group.items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {group.items.map((s: any) => {
                  const sEpic = typeof s.epic === 'object' ? s.epic : null
                  return (
                    <Link key={s.id} href={`/admin/pm/stories/${s.slug}`} className="flex items-center justify-between no-underline transition-colors" style={{ background: '#131B2E', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(148,163,184,0.08)', borderLeft: `3px solid ${cfg.color}` }}>
                      <div className="flex items-center gap-[14px]">
                        <span className="font-mono text-[11px] text-[#64748B] min-w-[28px]">#{s.id}</span>
                        <span className="font-body text-sm font-semibold text-[#F1F5F9]">{s.name}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-[14px]">
                        <ComplexityDots level={s.complexity} />
                        <span className="font-body text-[11px] text-[#64748B] min-w-[100px]">{sEpic?.name || '—'}</span>
                        <span className="font-mono text-[11px] text-[#475569]">{effortLabel(s.effort)}</span>
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
  )
}
