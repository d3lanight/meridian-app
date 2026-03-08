// EditNameSheet.tsx
// Profile v4 — Edit display name sub-view
// Version: 1.0.0
// Sprint: 35 (S167)
// Changelog:
//   1.0.0 - New component. Saves display_name to profiles table via Supabase.
//           Back button, input, Save button (accent gradient, disabled when empty).
//           Same sub-view pattern as ChangePasswordSheet (section state routing, no new routes).

'use client'

import { useState } from 'react'
import { M } from '@/lib/meridian'
import { createClient } from '@/lib/supabase/client'

const FONT_DISPLAY = "'Outfit', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

interface EditNameSheetProps {
  current: string | null
  userId: string
  onSave: (name: string) => void
  onBack: () => void
}

export function EditNameSheet({ current, userId, onSave, onBack }: EditNameSheetProps) {
  const [value, setValue] = useState(current ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSave = value.trim().length > 0

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ display_name: value.trim() })
        .eq('id', userId)
      if (dbError) throw dbError
      onSave(value.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 14,
          color: M.accentDeep,
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: 24,
          padding: 0,
          fontFamily: FONT_BODY,
        }}
      >
        ← Back
      </button>

      <h2
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 20,
          fontWeight: 500,
          color: M.text,
          marginBottom: 4,
        }}
      >
        Display Name
      </h2>
      <p style={{ fontSize: 13, color: M.textSecondary, marginBottom: 20 }}>
        How you appear in the app
      </p>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: M.textSecondary,
            marginBottom: 6,
            letterSpacing: '0.03em',
            fontFamily: FONT_BODY,
          }}
        >
          Name
        </label>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter your name"
          style={{
            width: '100%',
            padding: '11px 14px',
            background: 'rgba(255,255,255,0.8)',
            border: `1px solid ${M.borderSubtle}`,
            borderRadius: 12,
            color: M.text,
            fontSize: 14,
            fontFamily: FONT_BODY,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <div
          style={{
            fontSize: 11,
            color: M.negative,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        style={{
          width: '100%',
          padding: 14,
          background: canSave && !saving ? M.accentGradient : 'rgba(123,111,168,0.3)',
          border: 'none',
          borderRadius: 16,
          color: 'white',
          fontSize: 14,
          fontWeight: 500,
          fontFamily: FONT_BODY,
          cursor: canSave && !saving ? 'pointer' : 'not-allowed',
          boxShadow: canSave && !saving ? `0 4px 16px ${M.accentGlow}` : 'none',
          opacity: canSave && !saving ? 1 : 0.6,
        }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
