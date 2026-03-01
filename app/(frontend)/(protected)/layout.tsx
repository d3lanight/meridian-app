// ━━━ Protected Layout ━━━
// v0.6.0 · ca-story-design-refresh · Sprint 24
// Meridian v3: Cool Stone gradient, glassmorphic nav
'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import type { NavTab } from '@/types';
import { PrivacyProvider } from '@/contexts/PrivacyContext';
import { M } from '@/lib/meridian';

function getTabFromPath(pathname: string): NavTab {
  if (pathname.startsWith('/portfolio')) return 'portfolio';
  if (pathname.startsWith('/market')) return 'market';
  if (pathname.startsWith('/profile')) return 'profile';
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
      profile: '/profile',
    };
    window.location.href = routes[tab];
  };

return (
  <PrivacyProvider>
    <div className="min-h-screen font-body text-text-primary max-w-[428px] mx-auto relative pb-[88px] overflow-hidden" style={{ background: M.bg }}>
      {children}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  </PrivacyProvider>
);
}
