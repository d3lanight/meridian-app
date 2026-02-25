// ━━━ Protected Layout ━━━
// v0.5.0 · ca-story66 · 2026-02-21
// Meridian v2: warm cream gradient, glassmorphic nav
'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import type { NavTab } from '@/types';

function getTabFromPath(pathname: string): NavTab {
  if (pathname.startsWith('/portfolio')) return 'portfolio';
  if (pathname.startsWith('/market')) return 'market';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'home';
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeTab = getTabFromPath(pathname);

  const handleTabChange = (tab: NavTab) => {
    const routes: Record<NavTab, string> = {
      home: '/dashboard',
      portfolio: '/portfolio',
      market: '/market',
      settings: '/settings',
    };
    window.location.href = routes[tab];
  };

  return (
    <div
      className="min-h-screen font-body text-text-primary max-w-[428px] mx-auto relative pb-[88px] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #F5F1ED, #E8DED6)',
      }}
    >
      {children}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
