// ━━━ Asset Picker — Top assets + API search ━━━
// v2.2.0 · Sprint 36
// Changelog:
//   v2.2.0 — Held coins filtered out before rendering — no muted/disabled rows.
//             Parent passes full asset list; heldSymbols used for client-side exclusion.
//             Default list shows top unowned coins by rank (fills gap left by held coins).
//             Subtitle: removed "Top N · type to search more" — redundant.
//             Placeholder: "Search any coin..." (CoinGecko fallback for 250+ assets).
//   v2.1.0 — ca-story-design-refresh · Sprint 24: asset_mapping.name + icon_url

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { M } from '@/lib/meridian';
import type { AssetMapping } from '@/types';

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  core:   { bg: M.positiveDim,  text: M.positive },
  alt:    { bg: M.accentMuted,  text: M.accent   },
  stable: { bg: M.neutralDim,   text: M.textMuted },
};

// Default list cap — how many unowned coins to show before search
const DEFAULT_LIMIT = 20;

interface SearchResult extends AssetMapping {
  source?: 'local' | 'remote';
}

interface AssetPickerProps {
  assets: AssetMapping[];       // full ranked list from /api/assets?all=true
  heldSymbols: string[];
  onSelect: (asset: AssetMapping) => void;
  onClose: () => void;
}

export default function AssetPicker({ assets, heldSymbols, onSelect, onClose }: AssetPickerProps) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Default list: top unowned coins by rank, capped at DEFAULT_LIMIT
  const heldSet = new Set(heldSymbols.map(s => s.toUpperCase()));
  const defaultList = assets
    .filter(a => !heldSet.has(a.symbol.toUpperCase()))
    .slice(0, DEFAULT_LIMIT);

  // Search results are also filtered — don't show already-held coins
  const filteredSearchResults = searchResults
    ? searchResults.filter(a => !heldSet.has(a.symbol.toUpperCase()))
    : null;

  const displayList = filteredSearchResults ?? defaultList;

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/asset-search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results ?? []);
      }
    } catch {
      // Search failed — keep showing what we have
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = search.trim();
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => doSearch(q), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, doSearch]);

  const handleSelect = async (asset: SearchResult) => {
    if (asset.source === 'remote' && asset.coingecko_id) {
      try {
        const res = await fetch('/api/asset-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coingecko_id: asset.coingecko_id,
            symbol: asset.symbol,
            name: asset.name,
            icon_url: asset.icon_url,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          onSelect(data.asset);
          return;
        }
      } catch {
        // Fall through
      }
    }
    onSelect(asset);
  };

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
          {searchResults && (
            <p className="text-xs mt-0.5" style={{ color: M.textMuted }}>
              {filteredSearchResults?.length ?? 0} result{(filteredSearchResults?.length ?? 0) !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${M.border}` }}
        >
          <X size={18} color={M.textSecondary} />
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div
          className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${M.border}` }}
        >
          {searching ? (
            <Loader2 size={16} color={M.textMuted} className="animate-spin" />
          ) : (
            <Search size={16} color={M.textMuted} />
          )}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search any coin..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: M.text }}
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} className="bg-transparent border-none cursor-pointer p-0">
              <X size={14} color={M.textMuted} />
            </button>
          )}
        </div>
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-2">
          {displayList.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: M.textMuted }}>
              {searching ? 'Searching...' : `No assets match "${search}"`}
            </div>
          ) : (
            displayList.map(asset => {
              const name = asset.name || asset.symbol;
              const cat = CAT_COLORS[asset.category || ''] || CAT_COLORS.alt;
              const isRemote = (asset as SearchResult).source === 'remote';

              return (
                <button
                  key={`${asset.symbol}-${asset.id}`}
                  onClick={() => handleSelect(asset as SearchResult)}
                  className="flex items-center justify-between rounded-3xl px-4 py-3.5 border-none cursor-pointer text-left w-full"
                  style={{
                    background: M.surface,
                    backdropFilter: M.surfaceBlur,
                    WebkitBackdropFilter: M.surfaceBlur,
                    border: `1px solid ${M.border}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {asset.icon_url ? (
                      <img
                        src={asset.icon_url}
                        alt={asset.symbol}
                        width={40}
                        height={40}
                        className="rounded-full"
                        style={{ background: M.surfaceLight }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const next = target.nextElementSibling as HTMLElement;
                          if (next) next.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-10 h-10 rounded-full items-center justify-center text-xs font-semibold"
                      style={{
                        display: asset.icon_url ? 'none' : 'flex',
                        background: `linear-gradient(135deg, ${M.accentMuted}, ${M.accentDim})`,
                        color: M.accent,
                      }}
                    >
                      {asset.symbol.slice(0, 3)}
                    </div>

                    <div>
                      <div className="text-sm font-medium" style={{ color: M.text }}>{name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: M.textMuted }}>{asset.symbol}</span>
                        {asset.category && (
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase"
                            style={{ background: cat.bg, color: cat.text, letterSpacing: '0.05em' }}
                          >
                            {asset.category}
                          </span>
                        )}
                        {isRemote && (
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(98,126,234,0.1)', color: '#627EEA' }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selector dot */}
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ border: `2px solid ${M.surfaceLight}` }}
                  />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
