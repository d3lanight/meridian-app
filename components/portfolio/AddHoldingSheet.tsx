// ━━━ Add Holding Sheet — Asset select → Quantity → Confirm ━━━
// v1.4.0 · S189d
// Changelog:
//   v1.4.0 — S189d: Decimal-aware qty input (type=text, inputMode=decimal). Max decimals
//            from asset_mapping.decimals (fallback 8). Hint shown in label.
//            useEffect resets all state on isOpen→false. setSaving(false) in handleClose.
// Changelog:
//   v1.3.0 — S177: Refactored to use shared BottomSheet (scrollable=true). Removed inline scroll lock.
//   v1.2.0 — S169: CryptoIcon for confirmation step; scroll lock useEffect.
//   v1.1.0 · ca-story-design-refresh · Sprint 24

'use client';

import { useState, useEffect } from 'react';
import { Check, X, ChevronLeft } from 'lucide-react';
import { M } from '@/lib/meridian';
import AssetPicker from './AssetPicker';
import CryptoIcon from '@/components/shared/CryptoIcon';
import BottomSheet from '@/components/shared/BottomSheet';
import type { AssetMapping } from '@/types';

interface AddHoldingSheetProps {
  isOpen: boolean;
  assets: AssetMapping[];
  heldSymbols: string[];
  onAdd: (asset: string, quantity: number, costBasis?: number | null) => Promise<boolean>;
  onClose: () => void;
}

export default function AddHoldingSheet({ isOpen, assets, heldSymbols, onAdd, onClose }: AddHoldingSheetProps) {
  const [step, setStep] = useState<'select' | 'quantity'>('select');
  const [selected, setSelected] = useState<AssetMapping | null>(null);
  const [qty, setQty] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset all state whenever sheet closes (covers programmatic close from parent, not just handleClose)
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelected(null);
      setQty('');
      setCostBasis('');
      setError(null);
      setSaving(false);
    }
  }, [isOpen]);

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

  const handleClose = () => {
    // Reset state on close
    setStep('select');
    setSelected(null);
    setQty('');
    setCostBasis('');
    setError(null);
    onClose();
  };

  // Max decimal places for the selected coin — from asset_mapping, fallback 8
  const maxDecimals = selected?.decimals ?? 8

  const handleQtyChange = (raw: string) => {
    // Allow empty, integers, and decimals up to maxDecimals
    if (raw === '' || raw === '.') { setQty(raw); return }
    const dotIdx = raw.indexOf('.')
    if (dotIdx !== -1 && raw.length - dotIdx - 1 > maxDecimals) return  // reject excess dp
    if (!/^\d*\.?\d*$/.test(raw)) return  // reject non-numeric
    setQty(raw)
  }

  const isValid = qty && parseFloat(qty) > 0 && (!costBasis || parseFloat(costBasis) >= 0);
  const name = selected?.name || selected?.symbol || '';

  // AssetPicker step — full-height, scrollable
  if (step === 'select') {
    return (
      <BottomSheet isOpen={isOpen} onClose={handleClose} scrollable={true}>
        <AssetPicker
          assets={assets}
          heldSymbols={heldSymbols}
          onSelect={handleSelect}
          onClose={handleClose}
        />
      </BottomSheet>
    );
  }

  // Quantity step — scrollable (inputs + optional keyboard push)
  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} scrollable={true}>
      <div className="flex flex-col" style={{ padding: '0 20px 28px' }}>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 pt-1">
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
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${M.border}` }}
          >
            <X size={18} color={M.textSecondary} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-2 pb-4">
          <div className="flex-1 h-1 rounded-full" style={{ background: M.positive }} />
          <div className="flex-1 h-1 rounded-full" style={{ background: M.accentGradient }} />
        </div>

        {/* Selected asset card */}
        <div
          className="rounded-3xl p-4 mb-5"
          style={{
            background: `linear-gradient(135deg, ${M.accentMuted}, ${M.accentDim})`,
            border: `1px solid ${M.borderAccent}`,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <CryptoIcon symbol={selected?.symbol || ''} size={48} iconUrl={selected?.icon_url} />
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
            {maxDecimals > 0 && (
              <span style={{ color: M.textMuted, marginLeft: 6 }}>
                (up to {maxDecimals} decimal{maxDecimals !== 1 ? 's' : ''})
              </span>
            )}
          </label>
          <input
            type="text"
            inputMode="decimal"
            min="0"
            value={qty}
            onChange={e => handleQtyChange(e.target.value)}
            placeholder="0"
            autoFocus
            className="w-full rounded-2xl px-5 py-4 border-none outline-none text-2xl font-light"
            style={{
              background: 'rgba(255,255,255,0.6)',
              border: `1px solid ${M.border}`,
              color: M.text,
            }}
          />
        </div>

        {/* Cost basis input */}
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
    </BottomSheet>
  );
}
