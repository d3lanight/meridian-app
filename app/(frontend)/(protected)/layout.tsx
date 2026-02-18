// ━━━ Protected Layout ━━━
// v0.4.0 · ca-story39 · 2026-02-18
// Route-aware tab state: reads pathname to set active tab
'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import type { NavTab } from '@/types';

function getTabFromPath(pathname: string): NavTab {
  if (pathname.startsWith('/portfolio')) return 'portfolio';
  if (pathname.startsWith('/signals')) return 'signals';
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
      signals: '/dashboard',
      settings: '/settings/config',
    };
    window.location.href = routes[tab];
  };

  return (
    <div
      className="min-h-screen font-body text-text-primary max-w-[428px] mx-auto relative pb-[88px] overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #0B1120 0%, #0D1526 50%, #0B1120 100%)',
      }}
    >
      {children}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
