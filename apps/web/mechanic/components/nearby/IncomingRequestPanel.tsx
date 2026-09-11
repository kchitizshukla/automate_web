'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { NearbyRequest } from '@automate/shared-types';
import { formatDistance, formatEta, getMechanicPayout } from '@automate/shared-utils';
import { notify } from '@/components/kit';
import { unlockAudio } from '@/lib/nearby/notificationSound';
import { useIncomingRequests } from '@/lib/nearby/useIncomingRequests';
import { EASE } from '@/lib/motion';

/**
 * Global dispatch alert. Mounted once in the authenticated layout so a
 * request reaches the mechanic on whichever screen they are on.
 *
 * Desktop: a card sliding in from the right. Mobile: a bottom sheet.
 */
export function IncomingRequestPanel() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { pending, accept, reject } = useIncomingRequests(true);
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const [dismissed, setDismissed] = useState<number[]>([]);

  const request = pending.find((r) => !dismissed.includes(r.id)) ?? null;

  async function onAccept(r: NearbyRequest) {
    setBusy('accept');
    try {
      await accept(r.id);
      notify.success('Job accepted — navigate to the customer');
      router.push(`/nearby/${r.id}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Could not accept the job');
    } finally {
      setBusy(null);
    }
  }

  async function onReject(r: NearbyRequest) {
    setBusy('reject');
    try {
      await reject(r.id, 'Declined by mechanic');
      notify.info('Request declined — the customer has been notified');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Could not decline the job');
    } finally {
      setBusy(null);
    }
  }

  const payout = request ? getMechanicPayout(request.pricing) : null;

  // Rendered into <body>. The authenticated Shell animates its content with a
  // transform, and a transformed ancestor becomes the containing block for
  // position: fixed — which would pin this panel to the page box instead of
  // the viewport and push it below the fold on mobile.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {request && (
        <motion.div
          key={request.id}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center p-3 sm:inset-y-0 sm:left-auto sm:right-0 sm:items-start sm:p-5"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.32, ease: EASE }}
          role="alertdialog"
          aria-label="New roadside request"
        >
          <motion.div
            className="pointer-events-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 sm:mt-16"
            initial={reduce ? false : { scale: 0.97 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={unlockAudio}
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-4 text-white">
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <div className="relative flex items-center gap-3">
                <motion.span
                  aria-hidden
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20 text-xl backdrop-blur"
                  animate={reduce ? undefined : { scale: [1, 1.12, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  🚨
                </motion.span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold leading-tight">New roadside request</p>
                  <p className="truncate text-xs text-indigo-100">
                    {request.reference} · from {request.userName ?? 'a customer'}
                  </p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                  {pending.length > 1 ? `+${pending.length - 1} more` : 'Live'}
                </span>
              </div>
            </div>

            {/* Facts — every value comes from the request, none hardcoded */}
            <div className="space-y-3 px-5 py-4">
              <Row icon="🚗" text={`${request.vehicle.make} ${request.vehicle.model}${request.vehicle.year ? ` ${request.vehicle.year}` : ''}`} sub={request.vehicle.registrationNo ?? undefined} />
              <Row icon="🔧" text={request.issueLabel} sub={request.description ?? undefined} />
              <div className="grid grid-cols-3 gap-2">
                <Stat icon="📍" label="Distance" value={formatDistance(request.distanceKm)} />
                <Stat icon="⏱" label="ETA" value={formatEta(request.etaMinutes)} />
                <Stat icon="💰" label="Estimate" value={request.pricing.requiresDiagnosis ? 'On diagnosis' : request.pricing.display} small />
              </div>
              {payout && !request.pricing.requiresDiagnosis && (
                <p className="text-center text-xs text-slate-500">
                  Your expected earnings: <span className="font-semibold text-slate-700">{payout.display}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={() => void onReject(request)}
                disabled={busy !== null}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {busy === 'reject' ? 'Declining…' : 'Reject'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/nearby/${request.id}`)}
                disabled={busy !== null}
                className="shrink-0 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => void onAccept(request)}
                disabled={busy !== null}
                className="flex-1 rounded-2xl bg-aurora px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60"
              >
                {busy === 'accept' ? 'Accepting…' : 'Accept Job'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDismissed((d) => [...d, request.id])}
              className="w-full border-t border-slate-100 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            >
              Hide for now — it stays in Roadside Jobs
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Row({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span aria-hidden className="mt-0.5 text-base">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{text}</p>
        {sub && <p className="line-clamp-2 text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, small }: { icon: string; label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        <span aria-hidden>{icon}</span> {label}
      </p>
      <p className={`mt-0.5 font-semibold text-slate-800 ${small ? 'text-[11px]' : 'text-sm'}`}>{value}</p>
    </div>
  );
}
