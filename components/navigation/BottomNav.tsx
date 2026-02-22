// ━━━ Bottom Navigation ━━━
// v0.6.0 · design-unification · 2026-02-22
// Label updates: Home→Today, Market→Pulse (matches v2 design artifacts)
'use client';

import { Home, Target, Activity, Settings } from 'lucide-react';
import { M } from '@/lib/meridian';
import type { NavTab } from '@/types';

const tabs: { id: NavTab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Today' },
  { id: 'market', icon: Activity, label: 'Pulse' },
  { id: 'portfolio', icon: Target, label: 'Portfolio' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
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
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-[5px] bg-transparent border-none cursor-pointer px-4 py-1 relative transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
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
                    background: 'linear-gradient(90deg, #F4A261, #E76F51)',
                  }}
                />
              )}

              {/* Icon pill */}
              <div
                className="w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(244,162,97,0.15), rgba(231,111,81,0.15))'
                    : 'transparent',
                }}
              >
                <Icon
                  size={20}
                  color={isActive ? '#E76F51' : M.textMuted}
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
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
