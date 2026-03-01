// ━━━ usePortfolio Hook ━━━
// v1.1.0 · ca-story107 · 2026-03-01
// CRUD operations with optimistic UI
// S106: price_at_add auto-captured server-side
// S107: asset_id FK support (bidirectional trigger handles sync)

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Holding, AssetMapping } from '@/types';

interface AddHoldingParams {
  asset?: string;
  asset_id?: string;
  quantity: number;
  cost_basis?: number | null;
}

interface UsePortfolioReturn {
  holdings: Holding[];
  assets: AssetMapping[];
  isLoading: boolean;
  error: string | null;
  addHolding: (params: AddHoldingParams) => Promise<boolean>;
  updateHolding: (id: string, updates: {
    quantity?: number;
    cost_basis?: number | null;
    include_in_exposure?: boolean;
  }) => Promise<boolean>;
  removeHolding: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function usePortfolio(): UsePortfolioReturn {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [assets, setAssets] = useState<AssetMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) throw new Error('Failed to fetch holdings');
      const data = await res.json();
      setHoldings(data.holdings ?? []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/assets');
      if (!res.ok) throw new Error('Failed to fetch assets');
      const data = await res.json();
      setAssets(data.assets ?? []);
    } catch {
      // Non-critical — asset list fallback handled in UI
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchHoldings(), fetchAssets()]);
    setIsLoading(false);
  }, [fetchHoldings, fetchAssets]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addHolding = useCallback(async (params: AddHoldingParams): Promise<boolean> => {
    const { asset, asset_id, quantity, cost_basis } = params;
    const symbol = asset?.toUpperCase() ?? '???';

    // Optimistic: add placeholder
    const tempId = `temp-${Date.now()}`;
    const optimistic: Holding = {
      id: tempId,
      asset: symbol,
      asset_id: asset_id ?? null,
      quantity,
      cost_basis: cost_basis ?? null,
      include_in_exposure: true,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setHoldings(prev => [...prev, optimistic].sort((a, b) => a.asset.localeCompare(b.asset)));

    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: symbol !== '???' ? symbol : undefined,
          asset_id,
          quantity,
          cost_basis,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add holding');
      }
      const data = await res.json();
      // Replace optimistic with real
      setHoldings(prev =>
        prev.map(h => h.id === tempId ? data.holding : h)
          .sort((a, b) => a.asset.localeCompare(b.asset))
      );
      return true;
    } catch (err: unknown) {
      // Rollback
      setHoldings(prev => prev.filter(h => h.id !== tempId));
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  const updateHolding = useCallback(async (
    id: string,
    updates: {
      quantity?: number;
      cost_basis?: number | null;
      include_in_exposure?: boolean;
    },
  ): Promise<boolean> => {
    // Optimistic: apply updates
    const previous = holdings.find(h => h.id === id);
    if (!previous) return false;

    setHoldings(prev =>
      prev.map(h => h.id === id ? { ...h, ...updates, updated_at: new Date().toISOString() } : h)
    );

    try {
      const res = await fetch(`/api/portfolio/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update holding');
      }
      const data = await res.json();
      setHoldings(prev => prev.map(h => h.id === id ? data.holding : h));
      return true;
    } catch (err: unknown) {
      // Rollback
      setHoldings(prev => prev.map(h => h.id === id ? previous : h));
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [holdings]);

  const removeHolding = useCallback(async (id: string): Promise<boolean> => {
    // Optimistic: remove
    const previous = holdings;
    setHoldings(prev => prev.filter(h => h.id !== id));

    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove holding');
      }
      return true;
    } catch (err: unknown) {
      // Rollback
      setHoldings(previous);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, [holdings]);

  return {
    holdings,
    assets,
    isLoading,
    error,
    addHolding,
    updateHolding,
    removeHolding,
    refresh,
  };
}