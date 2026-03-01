// ━━━ FeedSkeleton ━━━
// v1.0.0 · ca-story84 · Sprint 20
// Shimmer loading state for the journal feed

'use client'

import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'

function ShimmerBar({ w = '100%', h = 14, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: `linear-gradient(90deg, ${M.borderSubtle} 25%, rgba(255,255,255,0.6) 50%, ${M.borderSubtle} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

export default function FeedSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Greeting skeleton */}
      <div style={{ marginBottom: 8 }}>
        <ShimmerBar w="65%" h={28} r={8} />
        <div style={{ height: 8 }} />
        <ShimmerBar w="45%" h={14} />
      </div>

      {/* Regime card skeleton */}
      <div style={{ ...card({ padding: '16px 18px' }) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <ShimmerBar w={36} h={36} r={18} />
          <div style={{ flex: 1 }}>
            <ShimmerBar w="40%" h={12} />
            <div style={{ height: 6 }} />
            <ShimmerBar w="55%" h={18} />
          </div>
        </div>
        <ShimmerBar w="90%" h={13} />
        <div style={{ height: 4 }} />
        <ShimmerBar w="70%" h={13} />
      </div>

      {/* Price pair skeleton */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ ...card({ padding: '12px 14px' }), flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShimmerBar w={28} h={28} r={9} />
              <div>
                <ShimmerBar w={72} h={14} />
                <div style={{ height: 4 }} />
                <ShimmerBar w={40} h={10} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Snippet skeletons */}
      {[1, 2].map(i => (
        <div key={i} style={{ ...card({ padding: '12px 16px' }), display: 'flex', justifyContent: 'space-between' }}>
          <ShimmerBar w="35%" h={14} />
          <ShimmerBar w={48} h={14} />
        </div>
      ))}

      {/* Keyframe injection */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
