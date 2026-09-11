'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { NearbyRequest } from '@automate/shared-types';
import { formatCurrency, formatDistance, formatEta, getMechanicPayout, formatDateTime } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { Card, Loading, ErrorState, PageHeader, StatusBadge } from '@/components/ui';
import { Breadcrumbs, ConfirmDialog, notify } from '@/components/kit';
import { RouteMap } from '@/components/nearby/RouteMap';
import { CompleteJobDialog } from '@/components/nearby/CompleteJobDialog';
import { EASE } from '@/lib/motion';

/** Extra field the mechanic API adds on top of the shared shape. */
type MechanicNearbyRequest = NearbyRequest & {
  mechanicPayout?: { display: string };
  paymentMethod?: 'ONLINE' | 'CASH' | null;
  paymentStatus?: 'PENDING' | 'PAID' | 'CASH_SELECTED' | 'FAILED' | null;
  customerRating?: number | null;
};

export default function NearbyRequestPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [request, setRequest] = useState<MechanicNearbyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'accept' | 'reject' | 'complete' | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequest((await api.getNearbyRequest(id)) as MechanicNearbyRequest);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this request');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the detail view live while the job is still moving.
  useEffect(() => {
    if (!request || ['REJECTED', 'CANCELLED', 'RATED'].includes(request.status)) return;
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [request, load]);

  async function accept() {
    setBusy('accept');
    try {
      setRequest((await api.acceptNearbyRequest(id)) as MechanicNearbyRequest);
      notify.success('Job accepted — the customer can see your ETA');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Could not accept the job');
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    setBusy('reject');
    setConfirmReject(false);
    try {
      setRequest((await api.rejectNearbyRequest(id, 'Declined by mechanic')) as MechanicNearbyRequest);
      notify.info('Request declined — the customer has been notified');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Could not decline the job');
    } finally {
      setBusy(null);
    }
  }

  async function completeJob(finalAmount: number) {
    setBusy('complete');
    setCompleteError(null);
    try {
      setRequest((await api.completeNearbyJob(id, finalAmount)) as MechanicNearbyRequest);
      setCompleting(false);
      notify.success('Job completed — the customer has been asked to pay');
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : 'Could not complete the job');
    } finally {
      setBusy(null);
    }
  }

  async function progress(status: string, message: string) {
    try {
      setRequest((await api.updateNearbyStatus(id, status)) as MechanicNearbyRequest);
      notify.success(message);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Could not update the job');
    }
  }

  if (loading) return <Loading label="Loading request…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!request) return <ErrorState message="Request not found" onRetry={() => router.push('/nearby')} />;

  const pending = request.status === 'PENDING_MECHANIC_RESPONSE';
  const payout = request.mechanicPayout ?? getMechanicPayout(request.pricing);

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Dashboard', href: '/' }, { label: 'Roadside Jobs', href: '/nearby' }, { label: request.reference }]}
      />
      <PageHeader
        title={request.issueLabel}
        subtitle={`${request.reference} · raised ${formatDateTime(request.createdAt)}`}
        action={<StatusBadge status={request.status.replaceAll('_', ' ').toLowerCase()} />}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="grid gap-5 lg:grid-cols-[1.15fr_1fr]"
      >
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-display font-bold text-slate-900">Customer &amp; vehicle</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact label="Customer" value={request.userName ?? `User #${request.userId}`} sub={request.userPhone ?? undefined} />
              <Fact
                label="Vehicle"
                value={`${request.vehicle.make} ${request.vehicle.model}${request.vehicle.year ? ` ${request.vehicle.year}` : ''}`}
                sub={request.vehicle.registrationNo ?? 'Registration not on file'}
              />
              <Fact label="Distance" value={formatDistance(request.distanceKm)} />
              <Fact label="Estimated travel time" value={formatEta(request.etaMinutes)} />
            </dl>
          </Card>

          <Card>
            <h2 className="mb-2 font-display font-bold text-slate-900">Reported issue</h2>
            <p className="inline-flex rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
              {request.issueLabel}
            </p>
            <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
              {request.description || 'The customer did not add a description.'}
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 font-display font-bold text-slate-900">Pricing</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Estimated customer price</p>
                <p className="mt-0.5 font-display text-xl font-extrabold text-slate-900">{request.pricing.display}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Your expected earnings</p>
                <p className="mt-0.5 font-display text-xl font-extrabold text-slate-900">{payout.display}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">{request.pricing.note}</p>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-0">
            <RouteMap
              userLocation={request.userLocation}
              mechanicLocation={request.mechanicLocation}
              distanceKm={request.distanceKm}
              etaMinutes={request.etaMinutes}
              progress={0}
              userLabel={request.userName ?? 'Customer'}
              mechanicLabel="You"
              height="h-72"
              className="rounded-2xl"
            />
            <div className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer location</p>
              <p className="text-sm text-slate-700">
                {request.userLocation.label ??
                  `${request.userLocation.latitude.toFixed(4)}, ${request.userLocation.longitude.toFixed(4)}`}
              </p>
            </div>
          </Card>

          <Card>
            {pending ? (
              <div className="space-y-2">
                <button
                  onClick={() => void accept()}
                  disabled={busy !== null}
                  className="w-full rounded-2xl bg-aurora px-4 py-3.5 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60"
                >
                  {busy === 'accept' ? 'Accepting…' : 'Accept Job'}
                </button>
                <button
                  onClick={() => setConfirmReject(true)}
                  disabled={busy !== null}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {busy === 'reject' ? 'Declining…' : 'Reject Job'}
                </button>
              </div>
            ) : request.status === 'MECHANIC_ON_THE_WAY' ? (
              <button
                onClick={() => void progress('ARRIVED', 'Marked as arrived')}
                className="w-full rounded-2xl bg-aurora px-4 py-3.5 font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                I have arrived
              </button>
            ) : request.status === 'ARRIVED' ? (
              <button
                onClick={() => void progress('IN_SERVICE', 'Work started')}
                className="w-full rounded-2xl bg-aurora px-4 py-3.5 font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                Start work
              </button>
            ) : request.status === 'IN_SERVICE' ? (
              <button
                onClick={() => setCompleting(true)}
                className="w-full rounded-2xl bg-aurora px-4 py-3.5 font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                Complete Job
              </button>
            ) : ['PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'CASH_SELECTED', 'RATED'].includes(request.status) ? (
              <CompletionSummary request={request} />
            ) : (
              <p className="text-center text-sm text-slate-500">
                This request is {request.status.replaceAll('_', ' ').toLowerCase()}.
                {request.rejectionReason ? ` (${request.rejectionReason})` : ''}
              </p>
            )}
          </Card>
        </div>
      </motion.div>

      <CompleteJobDialog
        open={completing}
        request={request}
        submitting={busy === 'complete'}
        error={completeError}
        onClose={() => {
          setCompleting(false);
          setCompleteError(null);
        }}
        onConfirm={(amount) => void completeJob(amount)}
      />

      <ConfirmDialog
        open={confirmReject}
        title="Decline this job?"
        message="The customer will be told you are unavailable and asked to raise a new request."
        confirmLabel="Yes, decline"
        tone="danger"
        onConfirm={() => void reject()}
        onCancel={() => setConfirmReject(false)}
      />
    </>
  );
}

/** What the mechanic sees after completing: amount, how it was settled, rating. */
function CompletionSummary({ request }: { request: MechanicNearbyRequest }) {
  const paid = request.paymentStatus === 'PAID';
  const cash = request.paymentStatus === 'CASH_SELECTED';

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Final amount</p>
        <p className="font-display text-2xl font-extrabold tabular-nums">
          {request.finalAmount != null ? formatCurrency(request.finalAmount) : '—'}
        </p>
      </div>

      <div
        className={`rounded-2xl border p-3 ${
          paid
            ? 'border-emerald-200 bg-emerald-50'
            : cash
              ? 'border-amber-200 bg-amber-50'
              : 'border-slate-200 bg-slate-50'
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800">
          {paid
            ? 'Paid online — settled'
            : cash
              ? 'Cash — collect from the customer'
              : 'Awaiting the customer’s payment'}
        </p>
      </div>

      {request.customerRating != null ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Customer rating</p>
          <p className="mt-0.5 text-2xl" aria-label={`${request.customerRating} out of 5 stars`}>
            {'★'.repeat(request.customerRating)}
            <span className="text-slate-300">{'★'.repeat(5 - request.customerRating)}</span>
          </p>
        </div>
      ) : (
        <p className="text-center text-xs text-slate-400">Waiting for the customer to rate this job.</p>
      )}
    </div>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-800">{value}</dd>
      {sub && <dd className="text-xs text-slate-500">{sub}</dd>}
    </div>
  );
}
