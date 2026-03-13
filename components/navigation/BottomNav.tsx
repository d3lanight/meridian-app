// ━━━ Bottom Navigation ━━━
// v0.8.0 · S214 · Sprint 43
// Changelog:
//   v0.8.0 — S214: Ask orb added (Sparkles, 52px, gradient, elevated). onAskTap + askOpen props.
//             Nav split: left 2 tabs | centred orb | right 2 tabs. All existing tab logic unchanged.
//   v0.7.0 · ca-story-design-refresh · Sprint 24: Label updates: Home→Today, Market→Pulse
'use client';

import { Home, Shield, Activity, User, Sparkles } from 'lucide-react';
import { M } from '@/lib/meridian';
import type { NavTab } from '@/types';

const leftTabs:  { id: NavTab; icon: typeof Home; label: string }[] = [
  { id: 'home',   icon: Home,     label: 'Today' },
  { id: 'market', icon: Activity, label: 'Pulse' },
];

const rightTabs: { id: NavTab; icon: typeof Home; label: string }[] = [
  { id: 'exposure', icon: Shield, label: 'Exposure' },
  { id: 'profile',  icon: User,   label: 'Profile'  },
];

interface BottomNavProps {
  activeTab:   NavTab;
  onTabChange: (tab: NavTab) => void;
  onAskTap?:   () => void;   // optional — safe if layout hasn't wired it yet
  askOpen?:    boolean;      // drives orb gradient when chat sheet is open
}

export default function BottomNav({ activeTab, onTabChange, onAskTap, askOpen = false }: BottomNavProps) {
  function TabBtn({ id, icon: Icon, label }: { id: NavTab; icon: typeof Home; label: string }) {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => onTabChange(id)}
        className="flex flex-col items-center gap-[5px] bg-transparent border-none cursor-pointer px-4 py-1 relative transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] flex-1"
        aria-current={isActive ? 'page' : undefined}
        aria-label={label}
      >
        {/* Active top accent bar */}
        {isActive && (
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              top: '-10px',
              width: '32px',
              height: '2px',
              borderRadius: '2px',
              background: M.accentGradient,
            }}
          />
        )}

        {/* Icon pill */}
        <div
          className="w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            background: isActive
              ? `linear-gradient(135deg, ${M.accentDim}, ${M.accentMuted})`
              : 'transparent',
          }}
        >
          <Icon
            size={20}
            color={isActive ? M.accentDeep : M.textMuted}
            strokeWidth={isActive ? 2.5 : 2}
            className="transition-all duration-[250ms] ease-out"
          />
        </div>

        {/* Label */}
        <span
          className="text-[10px] transition-all duration-[250ms] ease-out"
          style={{
            fontWeight: isActive ? 600 : 500,
            color: isActive ? M.text : M.textMuted,
            opacity: isActive ? 1 : 0.8,
          }}
        >
          {label}
        </span>
      </button>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[428px]"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${M.borderSubtle}`,
        padding: '10px 16px 18px',
      }}
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center">
        {leftTabs.map(t => <TabBtn key={t.id} {...t} />)}

        {/* Ask orb — centred, elevated above nav bar */}
        <div className="flex-1 flex justify-center relative">
          <button
            onClick={onAskTap}
            aria-label="Ask Meridian"
            style={{
              position: 'absolute',
              top: -36,
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: askOpen
                ? `linear-gradient(135deg, ${M.accentDeep}, #3D3366)`
                : M.accentGradient,
              border: '3px solid rgba(255,255,255,0.85)',
              boxShadow: `0 4px 18px ${M.accentGlow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.3s ease',
            }}
          >
            <Sparkles size={20} color="white" />
          </button>
        </div>

        {rightTabs.map(t => <TabBtn key={t.id} {...t} />)}
      </div>
    </nav>
  );
}
