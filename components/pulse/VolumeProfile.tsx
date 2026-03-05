// ━━━ VolumeProfile ━━━ v1.0.0 · S162
'use client'
import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

interface VolumeProfileProps { totalVolume: number | null }

function getVolumeLevel(vol: number | null): { label: string; activeIdx: number; desc: string } {
  if (!vol) return { label: 'Unknown', activeIdx: -1, desc: 'Volume data unavailable' }
  const b = vol / 1e9
  if (b < 80) return { label: 'Low', activeIdx: 0, desc: 'Below-average activity — regime signal may be weaker' }
  if (b < 200) return { label: 'Moderate', activeIdx: 1, desc: 'Average activity — neither confirming nor contradicting the regime' }
  return { label: 'High', activeIdx: 2, desc: 'Above-average activity — strong conviction behind current moves' }
}

const BARS = [
  { w: 20, label: 'Low' },
  { w: 55, label: 'Moderate' },
  { w: 25, label: 'High' },
]

export default function VolumeProfile({ totalVolume }: VolumeProfileProps) {
  const { label, activeIdx, desc } = getVolumeLevel(totalVolume)
  return (
    <div style={{ ...card({ padding: 14 }), marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: M.text }}>Volume Profile</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: M.text }}>{label}</span>
      </div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
        {BARS.map((b, i) => (
          <div key={i} style={{ flex: b.w, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: '100%', height: 24, borderRadius: 6,
              background: i === activeIdx ? 'linear-gradient(135deg, #2A9D8F, rgba(42,157,143,0.7))' : M.surfaceLight,
              opacity: i === activeIdx ? 1 : 0.35,
            }} />
            <span style={{ fontSize: 8, color: i === activeIdx ? M.positive : M.textMuted, fontWeight: i === activeIdx ? 600 : 400 }}>{b.label}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: M.textSecondary, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{desc}</p>
    </div>
  )
}
