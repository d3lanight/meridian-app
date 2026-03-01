// ━━━ Edit Holding Sheet — Update quantity, cost basis, exposure toggle, remove ━━━
// v1.2.0 · ca-story-design-refresh · Sprint 24
// Meridian v2: glassmorphic, warm theme
// Fix: toggle + save button state tracking

'use client';

import { useState } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import { M } from '@/lib/meridian';
import type { Holding } from '@/types';



interface EditHoldingSheetProps {
  holding: Holding;
  onUpdate: (id: string, updates: {
    quantity?: number;
    cost_basis?: number | null;
    include_in_exposure?: boolean;
  }) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
  onClose: () => void;
}

export default function EditHoldingSheet({ holding, onUpdate, onRemove, onClose }: EditHoldingSheetProps) {
  // Store originals for comparison
  const origQty = holding.quantity;
  const origCb = holding.cost_basis;
  const origExposure = holding.include_in_exposure ?? true;

  const [qty, setQty] = useState(String(origQty));
  const [costBasis, setCostBasis] = useState(origCb != null ? String(origCb) : '');
  const [includeExposure, setIncludeExposure] = useState(origExposure);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = (holding as any).asset_mapping?.name || holding.asset;

  // Clean comparison against original values
  const currentQty = parseFloat(qty) || 0;
  const currentCb = costBasis ? parseFloat(costBasis) : null;

  const qtyChanged = currentQty !== origQty;
  const cbChanged = currentCb !== origCb;
  const exposureChanged = includeExposure !== origExposure;
  const hasChanges = qtyChanged || cbChanged || exposureChanged;

  const handleUpdate = async () => {
    if (!qty || parseFloat(qty) <= 0) return;
    if (!hasChanges) { onClose(); return; }

    setSaving(true);
    setError(null);

    const updates: Record<string, any> = {};
    if (qtyChanged) updates.quantity = currentQty;
    if (cbChanged) updates.cost_basis = currentCb;
    if (exposureChanged) updates.include_in_exposure = includeExposure;

    const ok = await onUpdate(holding.id, updates);
    if (ok) {
      onClose();
    } else {
      setError('Failed to update. Please try again.');
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    const ok = await onRemove(holding.id);
    if (ok) {
      onClose();
    } else {
      setError('Failed to remove. Please try again.');
      setRemoving(false);
    }
  };

  const isValid = qty && parseFloat(qty) > 0 && (!costBasis || parseFloat(costBasis) >= 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div>
          <h2
            className="text-xl font-display font-medium"
            style={{ color: M.text, letterSpacing: '-0.02em' }}
          >
            Edit holding
          </h2>
          <p className="text-xs mt-0.5" style={{ color: M.textMuted }}>Update or remove</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${M.border}` }}
        >
          <X size={18} color={M.textSecondary} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Asset identity */}
        <div
          className="rounded-3xl p-4 mb-5"
          style={{
            background: `linear-gradient(135deg, ${M.accentMuted}, ${M.accentDim})`,
            border: `1px solid ${M.borderAccent}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold relative" style={{ flexShrink: 0 }}>
              {(holding as any).asset_mapping?.icon_url ? (
                <img src={(holding as any).asset_mapping.icon_url} alt={holding.asset} width={48} height={48} style={{ borderRadius: '50%', display: 'block' }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: M.accentGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 600 }}>
                  {holding.asset.slice(0, 3)}
                </div>
              )}
            </div>
            <div>
              <div className="text-base font-medium" style={{ color: M.text }}>{name}</div>
              <div className="text-xs" style={{ color: M.textSecondary }}>{holding.asset}</div>
            </div>
          </div>
        </div>

        {/* Quantity */}
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
            className="w-full rounded-2xl px-5 py-4 border-none outline-none text-2xl font-light"
            style={{
              background: 'rgba(255,255,255,0.6)',
              border: `1px solid ${M.border}`,
              color: M.text,
            }}
          />
        </div>

        {/* Cost basis */}
        <div className="mb-4">
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

        {/* Include in exposure toggle */}
        <div
          className="rounded-3xl px-4 py-3.5 mb-5 flex items-center justify-between"
          style={{
            background: M.surface,
            backdropFilter: M.surfaceBlur,
            WebkitBackdropFilter: M.surfaceBlur,
            border: `1px solid ${M.border}`,
          }}
        >
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: M.text }}>
              Include in exposure
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: M.textMuted }}>
              Count toward posture & allocation
            </div>
          </div>
          <button
            onClick={() => setIncludeExposure(prev => !prev)}
            className="border-none cursor-pointer relative flex-shrink-0"
            style={{
              width: 48,
              height: 28,
              borderRadius: 28,
              background: includeExposure
                ? M.accentGradient
                : M.surfaceLight,
              transition: 'background 0.2s ease',
            }}
          >
            <div
              className="rounded-full absolute"
              style={{
                width: 20,
                height: 20,
                background: 'white',
                top: 4,
                left: includeExposure ? 24 : 4,
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            />
          </button>
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

        {/* Save button */}
        <button
          onClick={handleUpdate}
          disabled={!isValid || saving || !hasChanges}
          className="w-full rounded-2xl py-4 border-none text-base font-medium cursor-pointer flex items-center justify-center gap-2 transition-opacity mb-4"
          style={{
            background: M.accentGradient,
            color: 'white',
            boxShadow: `0 4px 16px ${M.accentGlow}`,
            opacity: (!isValid || saving || !hasChanges) ? 0.5 : 1,
          }}
        >
          <Check size={18} />
          {saving ? 'Saving...' : 'Save changes'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: M.surfaceLight }} />
          <span className="text-xs" style={{ color: M.textMuted }}>or</span>
          <div className="flex-1 h-px" style={{ background: M.surfaceLight }} />
        </div>

        {/* Remove */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full rounded-2xl py-4 text-base font-medium cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.6)',
              border: `1px solid ${M.border}`,
              color: M.negative,
            }}
          >
            <Trash2 size={18} /> Remove from portfolio
          </button>
        ) : (
          <div
            className="rounded-3xl p-5"
            style={{
              background: M.negativeDim,
              border: '1px solid rgba(231,111,81,0.2)',
            }}
          >
            <p className="text-sm font-medium mb-4" style={{ color: M.text }}>
              Remove {name}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-2xl py-3 text-sm font-medium cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: `1px solid ${M.border}`,
                  color: M.textSecondary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex-1 rounded-2xl py-3 text-sm font-medium cursor-pointer border-none"
                style={{
                  background: M.negative,
                  color: 'white',
                  opacity: removing ? 0.6 : 1,
                }}
              >
                {removing ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
