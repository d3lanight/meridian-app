// ━━━ Dev Tools: Scenario Switcher ━━━
// v0.5.0 · ca-story66 · 2026-02-21
// Meridian v2: glassmorphic panel, warm accent

'use client';

import { useState } from 'react';
import { Bug, X } from 'lucide-react';
import { M } from '@/lib/meridian';
import { scenarios } from '@/lib/demo-data';
import type { ScenarioId } from '@/lib/demo-data';

interface DevToolsProps {
  activeScenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
}

export default function DevTools({ activeScenario, onScenarioChange }: DevToolsProps) {
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-3 right-3 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border-none cursor-pointer transition-opacity hover:opacity-100 opacity-60"
          style={{
            background: M.surfaceElevated,
            backdropFilter: M.surfaceBlur,
            WebkitBackdropFilter: M.surfaceBlur,
            color: M.accent,
            border: `1px solid ${M.border}`,
          }}
          aria-label="Open dev tools"
        >
          <Bug size={12} />
          DEV
        </button>
      )}

      {open && (
        <div
          className="rounded-3xl p-3 min-w-[160px]"
          style={{
            background: M.surfaceElevated,
            backdropFilter: M.surfaceBlur,
            WebkitBackdropFilter: M.surfaceBlur,
            border: `1px solid ${M.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] font-semibold"
              style={{ color: M.accent, letterSpacing: '0.08em' }}
            >
              SCENARIO
            </span>
            <button
              onClick={() => setOpen(false)}
              className="bg-transparent border-none cursor-pointer p-0.5"
              aria-label="Close dev tools"
            >
              <X size={12} color={M.textMuted} />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {(Object.values(scenarios)).map((s) => {
              const isActive = s.id === activeScenario;
              return (
                <button
                  key={s.id}
                  onClick={() => onScenarioChange(s.id)}
                  className="text-left px-2.5 py-1.5 rounded-xl text-xs border-none cursor-pointer transition-colors"
                  style={{
                    background: isActive ? M.accentMuted : 'transparent',
                    color: isActive ? M.accent : M.textSecondary,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div
            className="text-[9px] mt-2 pt-2 text-center"
            style={{ color: M.textMuted, borderTop: `1px solid ${M.borderSubtle}` }}
          >
            v0.5.0 · ca-story66
          </div>
        </div>
      )}
    </div>
  );
}
