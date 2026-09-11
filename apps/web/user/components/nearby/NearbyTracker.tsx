'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { NearbyRequest } from '@automate/shared-types';
import { formatCurrency, formatDistance, formatEta, journeyProgress, classNames } from '@automate/shared-utils';
import { Card, Button } from '@/components/ui';
import { ConfirmDialog } from '@/components/kit';
import { RouteMap } from '@/components/nearby/RouteMap';
import { PaymentPanel } from '@/components/nearby/PaymentPanel';
import { RatingPanel } from '@/components/nearby/RatingPanel';
import { EASE } from '@/lib/motion';

const STATUS_COPY: Record<string, { title: string; sub: string; tone: string; icon: string }> = {
  PENDING_MECHANIC_RESPONSE: {
    title: 'Waiting for the mechanic to respond',
    sub: 'We have sent your request and are waiting for confirmation.',
    tone: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: '⏳',
  },
  ACCEPTED: {
    title: 'Mechanic found',
    sub: 'Your request has been accepted.',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: '✅',
  },
  MECHANIC_ON_THE_WAY: {
    title: 'Mechanic found',
    sub: 'Your mechanic is on the way.',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: '🛠',
  },
  ARRIVED: {
    title: 'Your mechanic has arrived',
    sub: 'Look out for them at your location.',
    tone: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: '🎉',
  },
  IN_SERVICE: {
    title: 'Work in progress',
    sub: 'Your mechanic is working on the vehicle.',
    tone: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: '🔧',
  },
  COMPLETED: {
    title: 'Job completed',
    sub: 'Your service is done.',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: '🎉',
  },
  PAYMENT_PENDING: {
    title: 'Job completed',
    sub: 'Please complete the payment below.',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: '🎉',
  },
  PAYMENT_COMPLETED: {
    title: 'Payment received',
    sub: 'Thanks! One last thing — how did it go?',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: '✅',
  },
  CASH_SELECTED: {
    title: 'Cash payment selected',
    sub: 'Pay the mechanic directly, then rate your experience.',
    tone: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: '💵',
  },
  RATED: {
    title: 'All done',
    sub: 'Thanks for using FixMyRide roadside assistance.',
    tone: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: '🏁',
  },
};

/** Live tracking card shown once a request exists. */
export function NearbyTracker({
  request,
  onCancel,
  cancelling,
  onUpdated,
}: {
  request: NearbyRequest;
  onCancel: () => void;
  cancelling?: boolean;
  /** Pushes a server response straight into the shared request state. */
  onUpdated: (r: NearbyRequest) => void;
}) {
  const reduce = useReducedMotion();
  const [confirming, setConfirming] = useState(false);
  const copy = STATUS_COPY[request.status] ?? STATUS_COPY.PENDING_MECHANIC_RESPONSE;

  const enRoute = request.status === 'MECHANIC_ON_THE_WAY';
  // Once the job is done the card becomes the payment/rating surface: the map
  // and ETA are no longer what the customer needs.
  const completed = ['COMPLETED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'CASH_SELECTED', 'RATED'].includes(
    request.status,
  );
  const paid = request.payment?.status === 'PAID' || request.payment?.status === 'CASH_SELECTED';
  const progress = journeyProgress(
    // The initial ETA is not sent separately; derive a stable denominator from
    // the largest ETA we have seen for this request.
    Math.max(request.etaMinutes ?? 0, initialEtaFor(request)),
    request.etaMinutes,
  );

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="mb-6"
    >
      <Card className="overflow-hidden p-0">
        {/* Status header */}
        <div className={classNames('flex items-center gap-3 border-b px-5 py-4', copy.tone)}>
          <motion.span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/70 text-xl"
            animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {copy.icon}
          </motion.span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold leading-tight">{copy.title}</p>
            <p className="text-sm opacity-90">{copy.sub}</p>
          </div>
          <span className="hidden shrink-0 rounded-full bg-white/70 px-2.5 py-1 font-mono text-[11px] font-semibold sm:block">
            {request.reference}
          </span>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            {/* Mechanic */}
            {request.mechanic ? (
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-aurora text-lg font-bold text-white shadow-glow">
                  {request.mechanic.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-slate-900">🛠 {request.mechanic.name}</p>
                  <p className="truncate text-sm text-slate-500">
                    {request.mechanic.workshopName ?? request.mechanic.specialization ?? 'Verified mechanic'}
                    {request.mechanic.rating != null && <> · ⭐ {Number(request.mechanic.rating).toFixed(1)}</>}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            )}

            {/* ETA — the number the user actually watches */}
            {(enRoute || request.status === 'ACCEPTED') && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Arriving in</p>
                <div className="flex items-end gap-3">
                  <AnimatePresence mode="popLayout">
                    <motion.p
                      key={request.etaMinutes ?? 'na'}
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.28, ease: EASE }}
                      className="font-display text-3xl font-extrabold tabular-nums text-slate-900"
                    >
                      {formatEta(request.etaMinutes)}
                    </motion.p>
                  </AnimatePresence>
                  <p className="pb-1 text-sm text-slate-600">{formatDistance(request.distanceKm)} away</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    animate={{ width: `${Math.round(progress * 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* Request facts */}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Fact label="Issue" value={`${request.issueLabel}`} />
              <Fact
                label="Vehicle"
                value={`${request.vehicle.make} ${request.vehicle.model}${request.vehicle.year ? ` ${request.vehicle.year}` : ''}`}
                sub={request.vehicle.registrationNo ?? undefined}
              />
              <Fact
                label={request.finalAmount != null ? 'Final amount' : 'Estimated cost'}
                value={
                  request.finalAmount != null
                    ? formatCurrency(request.finalAmount)
                    : request.pricing.display
                }
              />
              <Fact label="Status" value={request.status.replaceAll('_', ' ').toLowerCase()} />
            </dl>

            {request.description && (
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your description</p>
                <p className="mt-0.5 text-sm text-slate-700">{request.description}</p>
              </div>
            )}

            {request.status === 'PENDING_MECHANIC_RESPONSE' && (
              <Button variant="secondary" onClick={() => setConfirming(true)} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : 'Cancel request'}
              </Button>
            )}
          </div>

          {completed ? (
            <div className="space-y-4">
              <PaymentPanel request={request} onUpdated={onUpdated} />
              {/* Rating unlocks only once payment is settled one way or the other. */}
              <AnimatePresence>
                {paid && <RatingPanel key="rating" request={request} onUpdated={onUpdated} />}
              </AnimatePresence>
            </div>
          ) : (
            <RouteMap
              userLocation={request.userLocation}
              mechanicLocation={request.mechanicLocation}
              distanceKm={request.distanceKm}
              etaMinutes={request.etaMinutes}
              progress={enRoute ? progress : 0}
              mechanicLabel={request.mechanic?.name ?? 'Mechanic'}
              height="h-56 lg:h-full lg:min-h-[280px]"
            />
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={confirming}
        title="Cancel this request?"
        message="The mechanic will be notified and the request will be closed."
        confirmLabel="Yes, cancel"
        onConfirm={() => {
          setConfirming(false);
          onCancel();
        }}
        onCancel={() => setConfirming(false)}
      />
    </motion.div>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold capitalize text-slate-800">{value}</dd>
      {sub && <dd className="text-xs text-slate-500">{sub}</dd>}
    </div>
  );
}

// Remembers the largest ETA seen per request so the progress bar has a stable
// denominator without the backend having to send the initial value.
const initialEtaCache = new Map<number, number>();
function initialEtaFor(request: NearbyRequest): number {
  const seen = initialEtaCache.get(request.id) ?? 0;
  const next = Math.max(seen, request.etaMinutes ?? 0);
  initialEtaCache.set(request.id, next);
  return next;
}

/** Banner for a request that ended without a mechanic turning up. */
export function NearbyOutcomeBanner({
  request,
  onDismiss,
  onRetry,
}: {
  request: NearbyRequest;
  onDismiss: () => void;
  onRetry: () => void;
}) {
  const copy =
    request.status === 'REJECTED'
      ? {
          icon: '🙁',
          title: 'The mechanic declined this request',
          sub: request.rejectionReason
            ? `Reason: ${request.rejectionReason}. We could not automatically reassign it — please try again.`
            : "We're looking for another available mechanic. If nobody is free, raise the request again.",
        }
      : request.status === 'NO_MECHANIC_FOUND'
        ? {
            icon: '📡',
            title: 'No mechanic responded',
            sub: 'Nobody picked up your request in time. Please try again — availability changes quickly.',
          }
        : {
            icon: '✔️',
            title: 'Request closed',
            sub: `${request.reference} is now ${request.status.replaceAll('_', ' ').toLowerCase()}.`,
          };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center"
    >
      <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-xl">
        {copy.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold text-amber-900">{copy.title}</p>
        <p className="text-sm text-amber-800/90">{copy.sub}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={onDismiss}
          className="rounded-xl px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
        >
          Dismiss
        </button>
        <button
          onClick={onRetry}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:brightness-110"
        >
          Try again
        </button>
      </div>
    </motion.div>
  );
}
