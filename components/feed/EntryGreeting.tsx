// ━━━ EntryGreeting ━━━
// v1.0.0 · ca-story83 · Sprint 20

'use client'

import { M } from '@/lib/meridian'
import type { EntryGreetingData } from '@/lib/feed-types'

export default function EntryGreeting({ data }: { data: EntryGreetingData }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div style={{ marginBottom: 8 }}>
      <h1
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 26,
          fontWeight: 400,
          color: M.text,
          lineHeight: 1.3,
          marginBottom: 6,
        }}
      >
        {greeting}, {data.name}
      </h1>
      <p style={{ fontSize: 13, color: M.textMuted }}>{dateStr}</p>
    </div>
  )
}
