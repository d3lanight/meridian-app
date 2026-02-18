export function ComplexityDots({ level }: { level: string }) {
  const count = level === 'low' ? 1 : level === 'medium' ? 2 : 3
  return (
    <span className="inline-flex gap-1">
      {Array.from({ length: 3 }, (_, i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{
            width: 6, height: 6,
            background: i < count ? '#F5B74D' : '#1A2540',
          }}
        />
      ))}
    </span>
  )
}
