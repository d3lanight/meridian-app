// ━━━ LearnCard ━━━ v1.0.0 · S161
'use client'
import { useState } from 'react'
import { BookOpen, ChevronRight } from 'lucide-react'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

interface LearnCardProps {
  text: string
  topic: string
}

export default function LearnCard({ text, topic }: LearnCardProps) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ ...card({ padding: '14px 16px' }) }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: M.positiveDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <BookOpen size={14} color={M.positive} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: M.text, lineHeight: 1.55, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            {open ? text : text.slice(0, 120) + '...'}
          </p>
          <button
            onClick={() => setOpen(!open)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, marginTop: 6, fontSize: 11,
              color: M.positive, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {open ? 'Less' : `More on ${topic}`}
            <ChevronRight size={11} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
