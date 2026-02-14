// ━━━ Admin Config Editor ━━━
// v0.4.0 · ca-story19 · 2026-02-14
// Grouped config table with inline editing. Admin only.
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Save, RotateCcw, Shield, ChevronLeft } from 'lucide-react'
import { M } from '@/lib/meridian'
import Link from 'next/link'

interface ConfigEntry {
  id: string
  name: string
  value: string
  default_value: string | null
  description: string | null
  type: string | null
  category: string | null
  unit: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  archival: 'Archival',
  email: 'Email',
  portfolio: 'Portfolio',
  regime: 'Regime',
  suppression: 'Suppression',
}

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigEntry[]>([])
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/config')
      if (res.status === 401) {
        setError('Not authenticated')
        return
      }
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      setConfig(data.config)
      // Initialize edit values
      const vals: Record<string, string> = {}
      data.config.forEach((c: ConfigEntry) => { vals[c.id] = c.value })
      setEditValues(vals)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const handleSave = async (entry: ConfigEntry) => {
    const newValue = editValues[entry.id]
    if (newValue === entry.value) return // No change

    setSaving(entry.id)
    setSaveSuccess(null)
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, value: newValue }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      // Update local state
      setConfig(prev => prev.map(c => c.id === entry.id ? { ...c, value: newValue } : c))
      setSaveSuccess(entry.id)
      setTimeout(() => setSaveSuccess(null), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  const handleReset = (entry: ConfigEntry) => {
    if (entry.default_value !== null) {
      setEditValues(prev => ({ ...prev, [entry.id]: entry.default_value! }))
    }
  }

  const isChanged = (entry: ConfigEntry) => editValues[entry.id] !== entry.value

  // Group by category
  const grouped = config.reduce<Record<string, ConfigEntry[]>>((acc, c) => {
    const cat = c.category || 'system'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(c)
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="px-5 pt-5">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl animate-pulse" style={{ background: M.surfaceLight, height: 80 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/dashboard" className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: M.surfaceLight }}>
          <ChevronLeft size={18} style={{ color: M.textSecondary }} />
        </Link>
        <div className="flex items-center gap-2">
          <Shield size={18} style={{ color: M.accent }} />
          <span className="font-display text-lg font-semibold" style={{ color: M.text }}>
            System Config
          </span>
        </div>
        <div
          className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded"
          style={{ color: M.accent, background: `${M.accent}15` }}
        >
          ADMIN
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-3 text-[11px] px-3 py-2 rounded-lg"
          style={{ color: M.negative, background: `${M.negative}15` }}
          onClick={() => setError(null)}
        >
          {error}
        </div>
      )}

      {/* Config groups */}
      {Object.entries(grouped).sort().map(([category, entries]) => (
        <div key={category} className="mb-4">
          {/* Category header */}
          <div
            className="text-[10px] font-semibold font-body px-1 mb-2"
            style={{ letterSpacing: '0.1em', color: M.textMuted }}
          >
            {(CATEGORY_LABELS[category] || category).toUpperCase()}
          </div>

          {/* Entries */}
          <div className="rounded-2xl overflow-hidden" style={{ background: M.surfaceLight }}>
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="px-4 py-3"
                style={{
                  borderBottom: i < entries.length - 1 ? `1px solid ${M.surface}` : 'none',
                }}
              >
                {/* Name + description */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="text-[12px] font-medium font-mono" style={{ color: M.text }}>
                      {entry.name.split('.').pop()}
                    </div>
                    {entry.description && (
                      <div className="text-[10px] mt-0.5" style={{ color: M.textMuted }}>
                        {entry.description}
                      </div>
                    )}
                  </div>
                  {entry.unit && (
                    <span
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0"
                      style={{ color: M.textSubtle, background: M.surface }}
                    >
                      {entry.unit}
                    </span>
                  )}
                </div>

                {/* Value input + actions */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValues[entry.id] ?? entry.value}
                    onChange={(e) => setEditValues(prev => ({ ...prev, [entry.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave(entry) }}
                    className="flex-1 text-[13px] font-mono px-2.5 py-1.5 rounded-lg border-none outline-none"
                    style={{
                      background: M.surface,
                      color: isChanged(entry) ? M.accent : M.text,
                    }}
                  />

                  {/* Reset to default */}
                  {entry.default_value !== null && isChanged(entry) && (
                    <button
                      onClick={() => handleReset(entry)}
                      className="p-1.5 rounded-lg border-none cursor-pointer"
                      style={{ background: M.surface, color: M.textMuted }}
                      title={`Default: ${entry.default_value}`}
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}

                  {/* Save */}
                  {isChanged(entry) && (
                    <button
                      onClick={() => handleSave(entry)}
                      disabled={saving === entry.id}
                      className="p-1.5 rounded-lg border-none cursor-pointer"
                      style={{
                        background: `${M.accent}20`,
                        color: M.accent,
                      }}
                    >
                      <Save size={12} className={saving === entry.id ? 'animate-spin' : ''} />
                    </button>
                  )}

                  {/* Success indicator */}
                  {saveSuccess === entry.id && (
                    <span className="text-[10px] font-medium" style={{ color: M.positive }}>✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="text-center text-[10px] py-2" style={{ color: M.textSubtle }}>
        {config.length} config entries · Changes save immediately
      </div>
    </div>
  )
}
