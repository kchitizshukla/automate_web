'use client';

import React, { useEffect, useState } from 'react';
import type { NearbyRequest } from '@automate/shared-types';
import { formatCurrency } from '@automate/shared-utils';
import { Modal } from '@/components/kit';

/**
 * Two-step guard on completing a job: the mechanic confirms who/what they are
 * closing AND the amount being charged. Completion is never one tap.
 */
export function CompleteJobDialog({
  open,
  request,
  onClose,
  onConfirm,
  submitting,
  error,
}: {
  open: boolean;
  request: NearbyRequest;
  onClose: () => void;
  onConfirm: (finalAmount: number) => void;
  submitting?: boolean;
  error?: string | null;
}) {
  // Seeded from the quoted estimate so the common case is one tap of confirm,
  // but always editable — the final amount is never assumed.
  const suggested =
    request.finalAmount ??
    (request.pricing.min != null && request.pricing.max != null
      ? Math.round((request.pricing.min + request.pricing.max) / 2)
      : null);

  const [amount, setAmount] = useState<string>(suggested != null ? String(suggested) : '');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(suggested != null ? String(suggested) : '');
      setTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request.id]);

  const parsed = Number(amount);
  const valid = Number.isFinite(parsed) && parsed > 0;

  return (
    <Modal open={open} onClose={submitting ? () => undefined : onClose} title="Complete this job?" size="md">
      <div className="space-y-4">
        <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
          <Row label="Customer" value={request.userName ?? `User #${request.userId}`} />
          <Row
            label="Vehicle"
            value={`${request.vehicle.make} ${request.vehicle.model}${request.vehicle.year ? ` ${request.vehicle.year}` : ''}`}
            sub={request.vehicle.registrationNo ?? undefined}
          />
          <Row label="Issue" value={request.issueLabel} />
          <Row
            label="Quoted estimate"
            value={request.pricing.requiresDiagnosis ? 'To be determined after diagnosis' : request.pricing.display}
          />
        </dl>

        <div>
          <label htmlFor="final-amount" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Final service amount
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15">
            <span className="text-lg font-semibold text-slate-400">₹</span>
            <input
              id="final-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^\d.]/g, ''));
                setTouched(true);
              }}
              placeholder="0"
              className="w-full bg-transparent font-display text-xl font-bold tabular-nums text-slate-900 outline-none"
            />
          </div>
          {touched && !valid && (
            <p className="mt-1.5 text-xs text-red-600">Enter an amount greater than zero.</p>
          )}
          {valid && (
            <p className="mt-1.5 text-xs text-slate-500">
              The customer will be asked to pay {formatCurrency(parsed)}.
            </p>
          )}
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => valid && onConfirm(parsed)}
            disabled={!valid || submitting}
            className="rounded-2xl bg-aurora px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {submitting ? 'Completing…' : 'Complete Job'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 py-2.5">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="min-w-0 text-right">
        <span className="block truncate text-sm font-semibold text-slate-800">{value}</span>
        {sub && <span className="block text-xs text-slate-500">{sub}</span>}
      </dd>
    </div>
  );
}
