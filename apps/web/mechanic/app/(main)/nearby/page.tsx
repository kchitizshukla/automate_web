'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { NearbyRequest } from '@automate/shared-types';
import { formatDistance, formatEta, formatDateTime } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { Card, Loading, ErrorState, Empty, PageHeader, StatusBadge } from '@/components/ui';
import { Breadcrumbs, Stagger, StaggerItem } from '@/components/kit';
import { useIncomingRequests } from '@/lib/nearby/useIncomingRequests';

export default function NearbyJobsPage() {
  const { pending, active, loading, error, refresh } = useIncomingRequests(true);
  const [history, setHistory] = useState<NearbyRequest[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await api.mechanicNearbyHistory());
    } catch {
      // The live feed above is the important part; history is supplementary.
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, pending.length, active.length]);

  if (loading) return <Loading label="Loading roadside jobs…" />;
  if (error) return <ErrorState message={error} onRetry={() => void refresh()} />;

  const past = history.filter((r) => ['REJECTED', 'CANCELLED', 'COMPLETED', 'NO_MECHANIC_FOUND'].includes(r.status));

  return (
    <>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Roadside Jobs' }]} />
      <PageHeader
        title="Roadside Jobs"
        subtitle="Live SOS requests dispatched to you, newest first"
      />

      <Section title="Awaiting your response" count={pending.length} tone="amber">
        {pending.length === 0 ? (
          <Empty title="No requests waiting" hint="New roadside requests will pop up here instantly." icon="📡" />
        ) : (
          <Stagger className="grid gap-3 sm:grid-cols-2">
            {pending.map((r) => (
              <StaggerItem key={r.id}>
                <RequestCard request={r} highlight />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </Section>

      {active.length > 0 && (
        <Section title="In progress" count={active.length} tone="emerald">
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        </Section>
      )}

      {past.length > 0 && (
        <Section title="Past requests" count={past.length} tone="slate">
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((r) => (
              <RequestCard key={r.id} request={r} muted />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function Section({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone: 'amber' | 'emerald' | 'slate';
  children: React.ReactNode;
}) {
  const tones = {
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{count}</span>
      </div>
      {children}
    </section>
  );
}

function RequestCard({
  request,
  highlight,
  muted,
}: {
  request: NearbyRequest;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <Link href={`/nearby/${request.id}`}>
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card
          hover
          className={`h-full ${highlight ? 'ring-2 ring-indigo-400/60' : ''} ${muted ? 'opacity-70' : ''}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display font-bold text-slate-900">🔧 {request.issueLabel}</p>
              <p className="truncate text-xs text-slate-500">
                {request.reference} · {formatDateTime(request.createdAt)}
              </p>
            </div>
            <StatusBadge status={request.status.replaceAll('_', ' ').toLowerCase()} />
          </div>

          <p className="mt-3 text-sm text-slate-700">
            🚗 {request.vehicle.make} {request.vehicle.model}
            {request.vehicle.year ? ` ${request.vehicle.year}` : ''}
            {request.vehicle.registrationNo ? ` · ${request.vehicle.registrationNo}` : ''}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
              📍 {formatDistance(request.distanceKm)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
              ⏱ {formatEta(request.etaMinutes)}
            </span>
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
              💰 {request.pricing.requiresDiagnosis ? 'On diagnosis' : request.pricing.display}
            </span>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
