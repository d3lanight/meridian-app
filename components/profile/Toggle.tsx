import { M } from '@/lib/meridian'

interface ToggleProps {
  on: boolean
  onToggle: (value: boolean) => void
  disabled?: boolean
}

export function Toggle({ on, onToggle, disabled }: ToggleProps) {
  return (
    <button
      onClick={() => !disabled && onToggle(!on)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        padding: 2,
        background: on ? M.accentGradient : '#D4C8BD',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        transition: 'all 0.2s',
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transition: 'all 0.2s',
        }}
      />
    </button>
  )
}
