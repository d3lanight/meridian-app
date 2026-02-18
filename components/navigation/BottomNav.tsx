// ━━━ Bottom Navigation ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// 4-tab nav with amber active state, radial glow, gradient fade

'use client';

import { Home, Target, Activity, Settings } from 'lucide-react';
import { M } from '@/lib/meridian';
import type { NavTab } from '@/types';

const tabs: { id: NavTab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'portfolio', icon: Target, label: 'Portfolio' },
  { id: 'market', icon: Activity, label: 'Market' },
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
        background:
          'linear-gradient(180deg, rgba(13,21,38,0.0) 0%, rgba(13,21,38,0.85) 20%, rgba(13,21,38,0.98) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '14px 20px 26px',
      }}
      aria-label="Main navigation"
    >
      {/* Separator line */}
      <div
        className="absolute left-5 right-5"
        style={{
          top: '14px',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${M.border}, transparent)`,
        }}
      />

      <div className="flex justify-around items-center pt-1">
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
              {/* Active radial glow */}
              {isActive && (
                <div
                  className="absolute top-[-2px] left-1/2 -translate-x-1/2 w-9 h-9 rounded-full pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(245, 183, 77, 0.12), transparent 70%)',
                  }}
                />
              )}

              {/* Icon pill */}
              <div
                className="w-9 h-7 rounded-[10px] flex items-center justify-center transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  background: isActive ? 'rgba(245, 183, 77, 0.10)' : 'transparent',
                }}
              >
                <Icon
                  size={19}
                  color={isActive ? '#F5B74D' : '#4A5568'}
                  strokeWidth={isActive ? 2 : 1.5}
                  className="transition-all duration-[250ms] ease-out"
                />
              </div>

              {/* Label */}
              <span
                className="text-[10px] transition-all duration-[250ms] ease-out"
                style={{
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#F5B74D' : '#4A5568',
                  letterSpacing: '0.02em',
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

