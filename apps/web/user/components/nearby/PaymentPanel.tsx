'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { NearbyRequest, PaymentMethod } from '@automate/shared-types';
import { formatCurrency, classNames } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { EASE } from '@/lib/motion';

/**
 * The payment half of the job-completion flow. Renders inside the existing
 * tracker card — the customer is never sent to a separate payment screen.
 *
 * There is no card form anywhere here by design: the POC gateway simulates a
 * capture, so collecting card details would be theatre with real risk.
 */
export function PaymentPanel({
  request,
  onUpdated,
}: {
  request: NearbyRequest;
  onUpdated: (r: NearbyRequest) => void;
}) {
  const reduce = useReducedMotion();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payment = request.payment ?? null;
  const amount = request.finalAmount ?? payment?.amount ?? null;
  const settled = payment?.status === 'PAID' || payment?.status === 'CASH_SELECTED';

  async function pay(choice: PaymentMethod) {
    setProcessing(true);
    setError(null);
    try {
      const updated =
        choice === 'ONLINE'
          ? await api.payNearbyOnline(request.id)
          : await api.selectNearbyCash(request.id);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment could not be completed');
    } finally {
      setProcessing(false);
    }
  }

  /* ── Settled: receipt ──────────────────────── */
  if (settled && payment) {
    const online = payment.status === 'PAID';
    return (
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        className={classNames(
          'rounded-2xl border p-4',
          online ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50',
        )}
      >
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-xl">
            {online ? '✅' : '💵'}
          </span>
          <div className="min-w-0 flex-1">
            <p className={classNames('font-display font-bold', online ? 'text-emerald-900' : 'text-amber-900')}>
              {online ? 'Payment successful' : 'Cash payment selected'}
            </p>
            <p className={classNames('text-sm', online ? 'text-emerald-800/90' : 'text-amber-800/90')}>
              {online
                ? 'Your payment has been received.'
                : `Please pay ${amount != null ? formatCurrency(amount) : 'the amount'} directly to the mechanic.`}
            </p>
          </div>
        </div>

        <dl className="mt-3 grid gap-2 border-t border-black/5 pt-3 text-sm sm:grid-cols-2">
          <Line label="Amount" value={amount != null ? formatCurrency(amount) : '—'} />
          <Line label="Payment method" value={payment.method === 'CASH' ? 'Cash' : 'Online'} />
          <Line
            label="Status"
            value={online ? 'Paid' : 'Pay directly to mechanic'}
          />
          {payment.transactionId && <Line label="Reference" value={payment.transactionId} mono />}
        </dl>
      </motion.section>
    );
  }

  /* ── Processing ────────────────────────────── */
  if (processing) {
    return (
      <motion.section
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center">
          <motion.span
            aria-hidden
            className="h-10 w-10 rounded-full border-[3px] border-indigo-200 border-t-indigo-600"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p className="mt-3 font-display font-bold text-indigo-900">
          {method === 'CASH' ? 'Confirming…' : 'Processing payment…'}
        </p>
        <p className="mt-0.5 text-sm text-indigo-800/80">Please do not close this window.</p>
      </motion.section>
    );
  }

  /* ── Choose a method ───────────────────────── */
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="rounded-2xl border border-slate-200 p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display font-bold text-slate-900">Payment</h3>
        {payment?.attempts ? (
          <span className="text-xs text-slate-400">Attempt {payment.attempts + 1}</span>
        ) : null}
      </div>

      <div className="mt-2 rounded-xl bg-slate-900 px-4 py-3 text-white">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Amount payable</p>
        <p className="font-display text-3xl font-extrabold tabular-nums">
          {amount != null ? formatCurrency(amount) : '—'}
        </p>
        {request.pricing.display && !request.pricing.requiresDiagnosis && (
          <p className="mt-0.5 text-xs text-slate-400">Estimated {request.pricing.display}</p>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {error} <span className="font-semibold">You can try again below.</span>
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MethodCard
          icon="💳"
          title="Pay Online"
          hint="UPI, card or netbanking"
          selected={method === 'ONLINE'}
          onSelect={() => setMethod('ONLINE')}
        />
        <MethodCard
          icon="💵"
          title="Pay in Cash"
          hint="Hand the amount to the mechanic"
          selected={method === 'CASH'}
          onSelect={() => setMethod('CASH')}
        />
      </div>

      <button
        type="button"
        disabled={!method || amount == null}
        onClick={() => method && void pay(method)}
        className="mt-3 w-full rounded-2xl bg-aurora px-4 py-3.5 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {method === 'CASH'
          ? 'Confirm cash payment'
          : method === 'ONLINE'
            ? `Pay ${amount != null ? formatCurrency(amount) : ''} now`
            : 'Select a payment method'}
      </button>

      <p className="mt-2 text-center text-xs text-slate-400">
        Card details are never collected or stored in this preview.
      </p>
    </motion.section>
  );
}

function MethodCard({
  icon,
  title,
  hint,
  selected,
  onSelect,
}: {
  icon: string;
  title: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      aria-pressed={selected}
      className={classNames(
        'flex items-center gap-3 rounded-2xl border p-3 text-left transition',
        selected
          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50',
      )}
    >
      <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="block truncate text-xs text-slate-500">{hint}</span>
      </span>
      <span
        aria-hidden
        className={classNames(
          'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] text-white transition',
          selected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300',
        )}
      >
        {selected ? '✓' : ''}
      </span>
    </motion.button>
  );
}

function Line({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={classNames('text-sm font-semibold text-slate-800', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  );
}
