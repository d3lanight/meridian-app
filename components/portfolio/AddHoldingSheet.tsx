// ━━━ Add Holding Sheet — Asset select → Quantity → Confirm ━━━
// v1.1.0 · ca-story-design-refresh · Sprint 24
// Meridian v2: glassmorphic, warm theme, progress steps

'use client';

import { useState } from 'react';
import { Check, X, ChevronLeft } from 'lucide-react';
import { M } from '@/lib/meridian';
import AssetPicker from './AssetPicker';
import type { AssetMapping } from '@/types';

interface AddHoldingSheetProps {
  assets: AssetMapping[];
  heldSymbols: string[];
  onAdd: (asset: string, quantity: number, costBasis?: number | null) => Promise<boolean>;
  onClose: () => void;
}



export default function AddHoldingSheet({ assets, heldSymbols, onAdd, onClose }: AddHoldingSheetProps) {
  const [step, setStep] = useState<'select' | 'quantity'>('select');
  const [selected, setSelected] = useState<AssetMapping | null>(null);
  const [qty, setQty] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (asset: AssetMapping) => {
    setSelected(asset);
    setStep('quantity');
  };

  const handleSubmit = async () => {
    if (!selected || !qty || parseFloat(qty) <= 0) return;
    setSaving(true);
    setError(null);

    const cb = costBasis ? parseFloat(costBasis) : null;
    const ok = await onAdd(selected.symbol, parseFloat(qty), cb);

    if (ok) {
      onClose();
    } else {
      setError('Failed to add holding. Please try again.');
      setSaving(false);
    }
  };

  const isValid = qty && parseFloat(qty) > 0 && (!costBasis || parseFloat(costBasis) >= 0);

  if (step === 'select') {
    return (
      <AssetPicker
        assets={assets}
        heldSymbols={heldSymbols}
        onSelect={handleSelect}
        onClose={onClose}
      />
    );
  }

  const name = selected?.name || selected?.symbol || '';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2
            className="text-xl font-display font-medium"
            style={{ color: M.text, letterSpacing: '-0.02em' }}
          >
            Enter quantity
          </h2>
          <p className="text-xs mt-0.5" style={{ color: M.textMuted }}>
            How much {selected?.symbol}?
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${M.border}` }}
        >
          <X size={18} color={M.textSecondary} />
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-2 px-5 pb-4">
        <div className="flex-1 h-1 rounded-full" style={{ background: M.positive }} />
        <div
          className="flex-1 h-1 rounded-full"
          style={{ background: M.accentGradient }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Selected asset card */}
        <div
          className="rounded-3xl p-4 mb-5"
          style={{
            background: `linear-gradient(135deg, ${M.accentMuted}, ${M.accentDim})`,
            border: `1px solid ${M.borderAccent}`,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold relative" style={{ flexShrink: 0 }}>
              {selected?.icon_url ? (
                <img src={selected.icon_url} alt={selected.symbol} width={48} height={48} style={{ borderRadius: '50%', display: 'block' }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: M.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 600 }}>
                  {selected?.symbol?.slice(0, 3)}
                </div>
              )}
            </div>
            <div>
              <div className="text-base font-medium" style={{ color: M.text }}>{name}</div>
              <div className="text-xs" style={{ color: M.textSecondary }}>{selected?.symbol}</div>
            </div>
          </div>
          <button
            onClick={() => { setStep('select'); setQty(''); setCostBasis(''); }}
            className="bg-transparent border-none text-xs font-medium cursor-pointer p-0 flex items-center gap-1"
            style={{ color: M.accentDeep }}
          >
            <ChevronLeft size={14} /> Change asset
          </button>
        </div>

        {/* Quantity input */}
        <div className="mb-4">
          <label className="text-xs block mb-2" style={{ color: M.textMuted }}>
            Quantity <span style={{ color: M.negative }}>*</span>
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={qty}
            onChange={e => setQty(e.target.value)}
            placeholder="0.00"
            autoFocus
            className="w-full rounded-2xl px-5 py-4 border-none outline-none text-2xl font-light"
            style={{
              background: 'rgba(255,255,255,0.6)',
              border: `1px solid ${M.border}`,
              color: M.text,
            }}
          />
        </div>

        {/* Cost basis input (optional) */}
        <div className="mb-5">
          <label className="text-xs block mb-2" style={{ color: M.textMuted }}>
            Cost basis (USD) — optional
          </label>
          <input
            type="number"
            step="any"
            min="0"
            value={costBasis}
            onChange={e => setCostBasis(e.target.value)}
            placeholder="Average purchase price"
            className="w-full rounded-2xl px-5 py-3.5 border-none outline-none text-base"
            style={{
              background: 'rgba(255,255,255,0.6)',
              border: `1px solid ${M.border}`,
              color: M.text,
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="text-xs px-3 py-2 rounded-xl mb-4"
            style={{ color: M.negative, background: M.negativeDim }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className="w-full rounded-2xl py-4 border-none text-base font-medium cursor-pointer flex items-center justify-center gap-2 transition-opacity"
          style={{
            background: M.accentGradient,
            color: 'white',
            boxShadow: `0 4px 16px ${M.accentGlow}`,
            opacity: (!isValid || saving) ? 0.5 : 1,
          }}
        >
          <Check size={18} />
          {saving ? 'Adding...' : 'Add to portfolio'}
        </button>
      </div>
    </div>
  );
}
