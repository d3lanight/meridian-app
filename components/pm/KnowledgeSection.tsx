/**
 * KnowledgeSection Component
 * Version: 1.0
 * Story: ca-story29-pm-dashboard
 * 
 * Filterable knowledge documents with category pills
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface KnowledgeDoc {
  id: string
  title: string
  category: string
  audience: string
}

interface KnowledgeSectionProps {
  documents: KnowledgeDoc[]
}

const categoryColors: Record<string, string> = {
  workflow: 'bg-[#60A5FA]/10 text-[#60A5FA]',
  database: 'bg-[#34D399]/10 text-[#34D399]',
  diagram: 'bg-[#F5B74D]/10 text-[#F5B74D]',
  config: 'bg-[#A78BFA]/10 text-[#A78BFA]',
  default: 'bg-[#94A3B8]/10 text-[#94A3B8]',
}

export function KnowledgeSection({ documents }: KnowledgeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = Array.from(new Set(documents.map(d => d.category))).sort()

  // Filter docs
  const filteredDocs = selectedCategory
    ? documents.filter(d => d.category === selectedCategory)
    : documents

  // Group by category for display
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = []
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, KnowledgeDoc[]>)

  return (
    <div className="bg-[#131B2E] border border-[#1E293B] rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#0B1120]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-[#94A3B8]" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[#94A3B8]" />
          )}
          <span className="text-sm font-semibold text-[#F1F5F9]">Knowledge Documents</span>
        </div>
        <span className="text-xs text-[#64748B]">{documents.length} docs</span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-4 space-y-4">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                selectedCategory === null
                  ? 'bg-[#F5B74D] text-[#0B1120] font-medium'
                  : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#1E293B]/70'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors capitalize ${
                  selectedCategory === cat
                    ? 'bg-[#F5B74D] text-[#0B1120] font-medium'
                    : 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#1E293B]/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Document Grid */}
          <div className="space-y-4">
            {Object.entries(groupedDocs).map(([category, docs]) => (
              <div key={category}>
                <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">
                  {category}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {docs.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/admin/collections/knowledge-entries/${doc.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0B1120] hover:bg-[#0B1120]/70 transition-colors group">
                        <FileText className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                        <span className="text-sm text-[#F1F5F9] flex-1 truncate">
                          {doc.title}
                        </span>
                        <ExternalLink className="w-3 h-3 text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredDocs.length === 0 && (
            <div className="text-center py-8 text-sm text-[#64748B]">
              No documents in this category
            </div>
          )}
        </div>
      )}
    </div>
  )
}
