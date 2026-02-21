// ━━━ Asset Picker — Searchable asset list ━━━
// v1.0.0 · ca-story48 · 2026-02-21
// Meridian v2: glassmorphic list items, warm theme

'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { M } from '@/lib/meridian';
import type { AssetMapping } from '@/types';

// Asset display names (symbol → friendly name)
const ASSET_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana',
  DOT: 'Polkadot', ADA: 'Cardano', RUNE: 'THORChain',
  CHZ: 'Chiliz', DOGE: 'Dogecoin', THETA: 'Theta', GRT: 'The Graph',
};

// Category badge colors
const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  core: { bg: M.positiveDim, text: M.positive },
  alt: { bg: M.accentMuted, text: M.accent },
  stable: { bg: M.neutralDim, text: M.textMuted },
};

interface AssetPickerProps {
  assets: AssetMapping[];
  heldSymbols: string[];
  onSelect: (asset: AssetMapping) => void;
  onClose: () => void;
}

export default function AssetPicker({ assets, heldSymbols, onSelect, onClose }: AssetPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return assets;
    return assets.filter(a =>
      a.symbol.toLowerCase().includes(q) ||
      (ASSET_NAMES[a.symbol] || '').toLowerCase().includes(q)
    );
  }, [assets, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2
            className="text-xl font-display font-medium"
            style={{ color: M.text, letterSpacing: '-0.02em' }}
          >
            Select asset
          </h2>
          <p className="text-xs mt-0.5" style={{ color: M.textMuted }}>
            {assets.length} available
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.6)',
            border: `1px solid ${M.border}`,
          }}
        >
          <X size={18} color={M.textSecondary} />
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div
          className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(255,255,255,0.6)',
            border: `1px solid ${M.border}`,
          }}
        >
          <Search size={16} color={M.textMuted} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: M.text }}
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="bg-transparent border-none cursor-pointer p-0"
            >
              <X size={14} color={M.textMuted} />
            </button>
          )}
        </div>
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div
              className="text-center py-8 text-sm"
              style={{ color: M.textMuted }}
            >
              No assets match "{search}"
            </div>
          ) : (
            filtered.map(asset => {
              const isHeld = heldSymbols.includes(asset.symbol);
              const name = ASSET_NAMES[asset.symbol] || asset.symbol;
              const cat = CAT_COLORS[asset.category || ''] || CAT_COLORS.alt;

              return (
                <button
                  key={asset.symbol}
                  onClick={() => !isHeld && onSelect(asset)}
                  disabled={isHeld}
                  className="flex items-center justify-between rounded-3xl px-4 py-3.5 border-none cursor-pointer text-left w-full transition-opacity"
                  style={{
                    background: M.surface,
                    backdropFilter: M.surfaceBlur,
                    WebkitBackdropFilter: M.surfaceBlur,
                    border: `1px solid ${M.border}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    opacity: isHeld ? 0.4 : 1,
                    cursor: isHeld ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Symbol badge */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        background: `linear-gradient(135deg, ${M.accentMuted}, rgba(231,111,81,0.15))`,
                        color: M.accent,
                      }}
                    >
                      {asset.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: M.text }}>
                        {name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: M.textMuted }}>
                          {asset.symbol}
                        </span>
                        {asset.category && (
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase"
                            style={{ background: cat.bg, color: cat.text, letterSpacing: '0.05em' }}
                          >
                            {asset.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isHeld ? (
                    <span className="text-[10px] font-medium" style={{ color: M.textMuted }}>
                      Already held
                    </span>
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ border: `2px solid ${M.surfaceLight}` }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
