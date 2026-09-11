'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  formatCurrency,
  formatDateTime,
  statusLabel,
} from '@automate/shared-utils';
import { api } from '@/lib/api';
import { vehicleDisplayName } from '@automate/shared-utils';
import { normalizeService, type ServiceRequestView } from '@/lib/normalize';
import { Protected } from '@/components/Protected';
import {
  Button,
  Card,
  ErrorState,
  Loading,
  PageHeader,
  StatusBadge,
  Stars,
  Field,
  inputClass,
} from '@/components/ui';

const CANCELLABLE = ['pending', 'assigned', 'accepted', 'in_progress'];
const TRACK_STEPS = ['pending', 'assigned', 'accepted', 'in_progress', 'completed'];
const POLL_MS = 5000;

/* ── Live mechanic tracking (animated map placeholder) ── */
const PHASE: Record<string, { pct: number; label: string; icon: string; sub: string }> = {
  pending: { pct: 4, label: 'Finding your mechanic', icon: '🔍', sub: 'Matching you with a nearby expert…' },
  assigned: { pct: 20, label: 'Mechanic assigned', icon: '✅', sub: 'Your mechanic is getting ready.' },
  accepted: { pct: 58, label: 'On the way', icon: '🚐', sub: 'Heading to your location.' },
  in_progress: { pct: 90, label: 'Arrived & working', icon: '🔧', sub: 'Service is underway.' },
  completed: { pct: 100, label: 'Service completed', icon: '🎉', sub: 'All done — thanks for choosing us!' },
};

function MechanicTracker({ status, mechanicName }: { status: string; mechanicName?: string }) {
  const phase = PHASE[status] ?? PHASE.pending;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100">
      {/* Map placeholder */}
      <div
        className="relative h-40 bg-slate-50"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        {/* decorative roads */}
        <div className="absolute left-0 top-1/2 h-3 w-full -translate-y-1/2 bg-white/70" />
        <div className="absolute left-1/3 top-0 h-full w-3 bg-white/60" />

        {/* route line */}
        <div className="absolute left-[6%] right-[8%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200">
          <motion.div
            className="h-full rounded-full bg-aurora"
            initial={false}
            animate={{ width: `${phase.pct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* destination (home) */}
        <span className="absolute right-[6%] top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-lg shadow-md ring-1 ring-slate-200">🏠</span>

        {/* moving mechanic */}
        <motion.span
          className="absolute top-1/2 z-10 grid h-11 w-11 place-items-center rounded-full bg-aurora text-xl text-white shadow-glow"
          style={{ translateX: '-50%', translateY: '-50%' }}
          initial={false}
          animate={{ left: `${6 + (phase.pct / 100) * 80}%`, y: status === 'completed' ? 0 : [-2, 2, -2] }}
          transition={{
            left: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
            y: { duration: 1.2, repeat: status === 'completed' ? 0 : Infinity, ease: 'easeInOut' },
          }}
        >
          {status === 'pending' ? '🔍' : status === 'completed' ? '🎉' : '🚐'}
        </motion.span>
      </div>

      {/* status line */}
      <div className="flex items-center gap-3 bg-white/80 px-4 py-3">
        <motion.span
          key={phase.label}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-xl"
        >
          {phase.icon}
        </motion.span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{phase.label}</p>
          <p className="truncate text-xs text-slate-500">
            {mechanicName ? `${mechanicName} · ` : ''}{phase.sub}
          </p>
        </div>
      </div>
    </div>
  );
}

function ServiceDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [service, setService] = useState<ServiceRequestView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  const load = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true);
      setError('');
      try {
        const s = normalizeService(await api.getServiceRequest(id));
        setService(s);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load service');
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    load();
  }, [id, load]);

  // Poll every 5s while the service is still active (simulated real-time track).
  const statusRef = useRef<string | undefined>(undefined);
  statusRef.current = service?.status;
  useEffect(() => {
    const timer = setInterval(() => {
      const st = statusRef.current;
      if (st && (st === 'completed' || st === 'cancelled')) return;
      load(false);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function onCancel() {
    if (!service) return;
    setCancelling(true);
    try {
      const s = normalizeService(await api.cancelService(service.id));
      setService(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;
    setReviewing(true); setReviewMsg('');
    try {
      await api.reviewService(service.id, rating, comment || undefined);
      setReviewMsg('Thanks for your feedback!');
      load(false);
    } catch (err) {
      setReviewMsg(err instanceof Error ? err.message : 'Could not submit review');
    } finally {
      setReviewing(false);
    }
  }

  if (loading) return <Loading />;
  if (error && !service) return <ErrorState message={error} onRetry={() => load()} />;
  if (!service) return <ErrorState message="Service not found" />;

  const canCancel = CANCELLABLE.includes(service.status);
  const currentStep = TRACK_STEPS.indexOf(service.status);
  const isCancelled = service.status === 'cancelled';

  return (
    <>
      <PageHeader
        title={`${service.category}`}
        subtitle={`Request #${service.id}`}
        action={
          <Link href="/services" className="text-sm font-medium text-brand">
            ← All services
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Track */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Live tracking</h2>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                {lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString()}`
                  : 'Live'}
              </span>
            </div>
            {isCancelled ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                This request was cancelled.
              </p>
            ) : (
              <>
              <MechanicTracker status={service.status} mechanicName={(service as any).mechanicName} />
              <ol className="relative ml-3 mt-6 border-l border-gray-200">
                {TRACK_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <li key={step} className="mb-5 ml-5 last:mb-0">
                      <span
                        className={
                          'absolute -left-[9px] grid h-4 w-4 place-items-center rounded-full ' +
                          (done ? 'bg-brand' : 'bg-gray-300')
                        }
                      />
                      <p
                        className={
                          'text-sm ' +
                          (active
                            ? 'font-semibold text-brand'
                            : done
                              ? 'text-gray-800'
                              : 'text-gray-400')
                        }
                      >
                        {statusLabel(step)}
                      </p>
                    </li>
                  );
                })}
              </ol>
              </>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold">Description</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {service.description}
            </p>
          </Card>

          {/* Post-completion feedback (AutoRevive: Completion & Feedback) */}
          {service.status === 'completed' && (
            <Card>
              <h2 className="mb-1 font-display text-base font-bold text-slate-900">Rate your experience</h2>
              {(service as any).rated ? (
                <p className="mt-2 inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">✓ You’ve already rated this service. Thank you!</p>
              ) : (
                <form onSubmit={submitReview} className="mt-3 space-y-4">
                  <div className="flex items-center gap-3">
                    <Stars value={rating} size="lg" onChange={setRating} />
                    <span className="text-sm font-semibold text-slate-600">{rating}/5</span>
                  </div>
                  <Field label="Share your feedback (optional)">
                    <textarea className={inputClass} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the service quality?" />
                  </Field>
                  {reviewMsg && <p className={reviewMsg.startsWith('Thanks') ? 'text-sm text-green-600' : 'text-sm text-red-600'}>{reviewMsg}</p>}
                  <Button type="submit" disabled={reviewing}>{reviewing ? 'Submitting…' : 'Submit rating'}</Button>
                </form>
              )}
            </Card>
          )}
        </div>

        {/* Summary */}
        <Card className="h-fit">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <StatusBadge status={service.status} />
            </div>
            {(service as any).bookingRef && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Booking ref</span>
                <span className="font-mono font-medium text-slate-800">{(service as any).bookingRef}</span>
              </div>
            )}
            {(service as any).estimatedDuration && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Est. duration</span>
                <span className="font-medium">{(service as any).estimatedDuration}</span>
              </div>
            )}
            {service.make && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Vehicle</span>
                <span className="font-medium">
                  {service.vehicleCategoryIcon ?? ''} {vehicleDisplayName(service)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Booked</span>
              <span>{formatDateTime(service.createdAt)}</span>
            </div>
            {service.scheduledAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Scheduled</span>
                <span>{formatDateTime(service.scheduledAt)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Price</span>
              <span className="font-medium">
                {service.price != null
                  ? formatCurrency(service.price)
                  : 'Not set yet'}
              </span>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {canCancel && (
            <Button
              variant="danger"
              className="mt-4 w-full"
              onClick={onCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling…' : 'Cancel request'}
            </Button>
          )}
          {service.price != null && service.status === 'completed' && (
            <Link href="/payments" className="mt-3 block">
              <Button className="w-full">Go to payments</Button>
            </Link>
          )}
        </Card>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Protected>
      <ServiceDetail />
    </Protected>
  );
}
