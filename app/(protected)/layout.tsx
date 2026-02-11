// ━━━ Protected Layout ━━━
// v0.3.1 · ca-story11 · 2026-02-11
// Wraps protected pages with bottom nav. Auth gate added in story14.

'use client';

import { useState } from 'react';
import BottomNav from '@/components/navigation/BottomNav';
import type { NavTab } from '@/types';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  return (
    <div
      className="min-h-screen font-body text-text-primary max-w-[428px] mx-auto relative pb-[88px] overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #0B1120 0%, #0D1526 50%, #0B1120 100%)',
      }}
    >
      {children}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

