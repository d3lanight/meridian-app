import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SectionLabel } from '@/components/pm/SectionLabel'
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

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center font-mono uppercase font-semibold"
      style={{
        fontSize: 10, letterSpacing: '0.06em',
        color, background: bg,
        padding: '2px 8px', borderRadius: 10,
      }}
    >
      {label}
    </span>
  )
}

export default async function KnowledgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })

  let entry: any = null
  try {
    entry = await payload.findByID({
      collection: 'payload-knowledge-entries',
      id: Number(id),
    })
  } catch {
    // not found
  }

  if (!entry) {
    return (
      <div className="px-[28px] py-10">
        <p className="font-body text-sm text-[#64748B]">Knowledge entry not found</p>
      </div>
    )
  }

  const catCfg = categoryConfig[entry.category] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)' }

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
          <span className="font-body text-xs text-[#64748B]">Knowledge</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Pill label={entry.category?.replace('-', ' ') || '—'} color={catCfg.color} bg={catCfg.bg} />
          {entry.phase && (
            <Pill label={`Phase ${entry.phase}${entry.phase_stage ? ` · ${entry.phase_stage}` : ''}`} color="#60A5FA" bg="rgba(96,165,250,0.12)" />
          )}
        </div>

        <h1
          className="font-display font-bold text-[#F1F5F9]"
          style={{ fontSize: 28, letterSpacing: '-0.02em', margin: 0 }}
        >
          {entry.title}
        </h1>

        {entry.summary && (
          <p className="font-body text-sm text-[#94A3B8] mt-2 leading-[1.6]" style={{ maxWidth: 600 }}>
            {entry.summary}
          </p>
        )}
      </div>

      <div style={{ padding: '0 28px 24px' }}>
        <SectionLabel>Properties</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Audience', value: entry.audience || '—' },
            { label: 'Dimension', value: entry.dimension || '—' },
            { label: 'Phase', value: entry.phase_stage || (entry.phase ? `Phase ${entry.phase}` : '—') },
          ].map(p => (
            <div
              key={p.label}
              style={{
                background: '#131B2E',
                borderRadius: 14,
                padding: '16px 18px',
                border: '1px solid rgba(148,163,184,0.08)',
              }}
            >
              <div className="font-body text-[10px] tracking-[0.08em] text-[#64748B] uppercase font-semibold mb-2">
                {p.label}
              </div>
              <span className="font-body text-sm font-semibold text-[#F1F5F9] capitalize">
                {p.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {entry.content?.root?.children?.length > 0 && (
        <div style={{ padding: '0 28px 32px' }}>
          <SectionLabel>Content</SectionLabel>
          <div
            style={{
              background: '#131B2E',
              borderRadius: 14,
              padding: '18px 20px',
              border: '1px solid rgba(148,163,184,0.08)',
            }}
          >
            <LexicalContent content={entry.content} />
          </div>
        </div>
      )}
    </div>
  )
}
