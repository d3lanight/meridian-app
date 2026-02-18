/**
 * KnowledgeSection Component
 * Version: 2.0
 * Story: ca-story41-pm-dashboard-coherence
 *
 * Filterable knowledge docs with colored category pills and 2-col grid.
 * Matches pm-dashboard-b-v2.jsx lines 548–665.
 */

'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import Link from 'next/link'
import { SectionLabel } from '@/components/pm/SectionLabel'

interface KnowledgeDoc {
  id: string
  title: string
  category: string
  audience: string
}

interface KnowledgeSectionProps {
  documents: KnowledgeDoc[]
}

const categoryConfig: Record<string, { color: string; label: string }> = {
  'phase-overview': { color: '#A78BFA', label: 'Phase Overview' },
  standard: { color: '#60A5FA', label: 'Standard' },
  reference: { color: '#94A3B8', label: 'Reference' },
  'how-to': { color: '#34D399', label: 'How-To' },
  concept: { color: '#F472B6', label: 'Concept' },
  milestone: { color: '#F5B74D', label: 'Milestone' },
  'release-note': { color: '#34D399', label: 'Release Note' },
}

function getCategoryColor(cat: string): string {
  return categoryConfig[cat]?.color || '#94A3B8'
}

function getCategoryLabel(cat: string): string {
  return categoryConfig[cat]?.label || cat.replace(/-/g, ' ')
}

export function KnowledgeSection({ documents }: KnowledgeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Build category counts from live data
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    documents.forEach((doc) => {
      counts[doc.category] = (counts[doc.category] || 0) + 1
    })
    return counts
  }, [documents])

  const filteredDocs = activeCategory
    ? documents.filter((d) => d.category === activeCategory)
    : documents

  return (
    <div className="px-[28px] py-[20px]">
      {/* Header — NOT inside a card */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer py-[4px]"
        style={{ marginBottom: isExpanded ? 14 : 0 }}
      >
        <div className="flex items-center gap-[10px]">
          <SectionLabel color="#60A5FA">Phase Knowledge</SectionLabel>
          <span className="font-mono text-[10px] text-[#64748B]">
            {documents.length} entries
          </span>
        </div>
        <ChevronDown
          size={16}
          className="text-[#64748B] transition-transform duration-200"
          style={{
            transform: isExpanded ? 'rotate(0)' : 'rotate(-90deg)',
          }}
        />
      </div>

      {isExpanded && (
        <div>
          {/* Category filter pills */}
          <div className="flex gap-[6px] mb-[14px] flex-wrap">
            {/* All pill */}
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-[4px] text-[10px] font-semibold tracking-[0.02em] rounded-[20px] px-[10px] py-[4px] cursor-pointer transition-colors border"
              style={{
                color: activeCategory === null ? '#0B1120' : '#64748B',
                background:
                  activeCategory === null ? '#F5B74D' : '#131B2E',
                borderColor:
                  activeCategory === null
                    ? '#F5B74D'
                    : 'rgba(148,163,184,0.08)',
              }}
            >
              All
              <span
                className="font-mono text-[9px]"
                style={{
                  color: activeCategory === null ? '#0B1120' : '#475569',
                  opacity: activeCategory === null ? 0.7 : 1,
                }}
              >
                {documents.length}
              </span>
            </button>

            {Object.entries(categoryCounts).map(([cat, count]) => {
              const isActive = activeCategory === cat
              const catColor = getCategoryColor(cat)
              return (
                <button
                  key={cat}
                  onClick={() =>
                    setActiveCategory(isActive ? null : cat)
                  }
                  className="flex items-center gap-[4px] text-[10px] font-semibold tracking-[0.02em] rounded-[20px] px-[10px] py-[4px] cursor-pointer transition-colors border"
                  style={{
                    color: isActive ? '#0B1120' : catColor,
                    background: isActive ? catColor : '#131B2E',
                    borderColor: isActive
                      ? catColor
                      : 'rgba(148,163,184,0.08)',
                  }}
                >
                  {/* Dot indicator when inactive */}
                  {!isActive && (
                    <span
                      className="w-[5px] h-[5px] rounded-full"
                      style={{ background: catColor }}
                    />
                  )}
                  {getCategoryLabel(cat)}
                  <span
                    className="font-mono text-[9px]"
                    style={{
                      color: isActive ? '#0B1120' : '#475569',
                      opacity: isActive ? 0.7 : 1,
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Docs grid */}
          <div className="grid grid-cols-2 gap-[8px]">
            {filteredDocs.map((doc) => {
              const color = getCategoryColor(doc.category)
              return (
                <Link
                  key={doc.id}
                  href={`/admin/pm/knowledge/${doc.id}`}
                  className="block"
                >
                  <div
                    className="bg-[#131B2E] rounded-[10px] py-[12px] px-[14px] border border-[rgba(148,163,184,0.08)] flex items-start gap-[10px] cursor-pointer transition-colors hover:border-[rgba(245,183,77,0.15)]"
                  >
                    <FileText
                      size={14}
                      style={{ color }}
                      className="shrink-0 mt-[1px]"
                    />
                    <div>
                      <div className="text-[12px] font-semibold text-[#F1F5F9] leading-[1.3]">
                        {doc.title}
                      </div>
                      <div
                        className="text-[9px] font-semibold uppercase tracking-[0.06em] mt-[4px]"
                        style={{ color }}
                      >
                        {getCategoryLabel(doc.category)}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {filteredDocs.length === 0 && (
            <div className="text-center py-[24px] text-[12px] text-[#475569]">
              No entries in this category
            </div>
          )}
        </div>
      )}
    </div>
  )
}
