'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'

import { M } from '@/lib/meridian'
import { card } from '@/lib/ui-helpers'
import { createClient } from '@/lib/supabase/client'

// ═══════════════════════════════════════════════
// ChangePasswordSheet v1.0.0 — Inline password
// update within Profile page detail views
// Story: ca-story88-change-password | Sprint 21
// ═══════════════════════════════════════════════

interface ChangePasswordSheetProps {
  onBack: () => void
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function ChangePasswordSheet({ onBack }: ChangePasswordSheetProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const tooShort = password.length > 0 && password.length < 8
  const mismatch = confirm.length > 0 && password !== confirm
  const canSubmit =
    password.length >= 8 && password === confirm && status !== 'submitting'

  const handleSubmit = async () => {
    if (!canSubmit) return

    setStatus('submitting')
    setErrorMsg('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setStatus('error')
        setErrorMsg(error.message)
      } else {
        setStatus('success')
        setTimeout(() => onBack(), 1500)
      }
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
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
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ← Back
      </button>

      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 20,
          fontWeight: 500,
          color: M.text,
          marginBottom: 4,
        }}
      >
        Change password
      </h2>
      <p style={{ fontSize: 13, color: M.textSecondary, marginBottom: 24 }}>
        Choose a new password for your account
      </p>

      {/* Success message */}
      {status === 'success' && (
        <div
          style={{
            ...card({ padding: 16 }),
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            background: 'rgba(42,157,143,0.08)',
            border: `1px solid ${M.borderPositive}`,
          }}
        >
          <CheckCircle size={18} color={M.positive} />
          <span style={{ fontSize: 14, color: M.positive, fontWeight: 500 }}>
            Password updated successfully
          </span>
        </div>
      )}

      {/* Error message */}
      {status === 'error' && errorMsg && (
        <div
          style={{
            ...card({ padding: 16 }),
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            background: M.negativeDim,
            border: `1px solid rgba(231,111,81,0.2)`,
          }}
        >
          <AlertCircle size={18} color={M.negative} />
          <span style={{ fontSize: 13, color: M.negative }}>{errorMsg}</span>
        </div>
      )}

      {/* New password */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: M.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            display: 'block',
            marginBottom: 8,
          }}
        >
          New password
        </label>
        <div
          style={{
            ...card({ padding: 0 }),
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Lock size={15} color={M.textMuted} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              color: M.text,
              outline: 'none',
              padding: '14px 0',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showPassword ? (
              <EyeOff size={16} color={M.textMuted} />
            ) : (
              <Eye size={16} color={M.textMuted} />
            )}
          </button>
        </div>
        {tooShort && (
          <p style={{ fontSize: 11, color: M.negative, marginTop: 6, paddingLeft: 4 }}>
            Password must be at least 8 characters
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: M.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            display: 'block',
            marginBottom: 8,
          }}
        >
          Confirm password
        </label>
        <div
          style={{
            ...card({ padding: 0 }),
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Lock size={15} color={M.textMuted} />
          </div>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter new password"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              color: M.text,
              outline: 'none',
              padding: '14px 0',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            onClick={() => setShowConfirm(!showConfirm)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {showConfirm ? (
              <EyeOff size={16} color={M.textMuted} />
            ) : (
              <Eye size={16} color={M.textMuted} />
            )}
          </button>
        </div>
        {mismatch && (
          <p style={{ fontSize: 11, color: M.negative, marginTop: 6, paddingLeft: 4 }}>
            Passwords do not match
          </p>
        )}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 16,
          background: canSubmit ? M.accentGradient : M.borderSubtle,
          border: 'none',
          color: canSubmit ? 'white' : M.textMuted,
          fontSize: 14,
          fontWeight: 600,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'all 0.2s',
        }}
      >
        {status === 'submitting' ? 'Updating...' : 'Update password'}
      </button>
    </div>
  )
}
