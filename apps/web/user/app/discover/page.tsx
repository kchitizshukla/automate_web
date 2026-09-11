'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Mechanic } from '@automate/shared-types';
import { formatCurrency, classNames } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { normalizeMechanic } from '@/lib/normalize';
import { Protected } from '@/components/Protected';
import { Card, ErrorState, Empty, PageHeader, SkeletonCards, Stars, Select, inputClass, Loading } from '@/components/ui';
import { Breadcrumbs, Chip, notify } from '@/components/kit';
import { FindNearbyCta } from '@/components/nearby/FindNearbyCta';
import { FindNearbyDialog } from '@/components/nearby/FindNearbyDialog';
import { SearchingOverlay } from '@/components/nearby/SearchingOverlay';
import { NearbyTracker, NearbyOutcomeBanner } from '@/components/nearby/NearbyTracker';
import { useNearbyRequest } from '@/lib/nearby/useNearbyRequest';
import { AnimatePresence } from 'framer-motion';

function VendorCard({ m }: { m: Mechanic }) {
  return (
    <Link href={`/discover/${m.id}`}>
      <Card hover className="group h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-aurora text-lg font-bold text-white shadow-glow">
              {m.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
            </span>
            <div>
              <p className="font-display font-bold text-slate-900">{m.workshopName ?? m.name}</p>
              <p className="text-xs text-slate-500">{m.name} · {m.location ?? '—'}</p>
            </div>
          </div>
          <span className={classNames('rounded-full px-2 py-0.5 text-[11px] font-medium', m.available ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500')}>
            {m.available ? 'Available' : 'Busy'}
          </span>
        </div>

        <p className="mt-3 inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">{m.specialization ?? m.skills}</p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <Stars value={m.rating} />
            <span className="text-sm font-semibold text-slate-700">{m.rating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({m.reviewsCount ?? 0})</span>
          </div>
          <p className="text-sm font-semibold text-slate-700">
            from <span className="text-gradient">{m.priceFrom != null ? formatCurrency(m.priceFrom) : '—'}</span>
          </p>
        </div>
      </Card>
    </Link>
  );
}

function Discover() {
  const params = useSearchParams();
  const [all, setAll] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState('rating');

  // Roadside-assistance state. One hook owns the request; this screen only
  // decides which of its three visual states to show.
  const nearby = useNearbyRequest();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const searching = nearby.request?.status === 'PENDING_MECHANIC_RESPONSE' || nearby.request?.status === 'SEARCHING';

  const cancelRequest = useCallback(async () => {
    setCancelling(true);
    try {
      await nearby.cancel();
      notify.success('Request cancelled');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Could not cancel the request');
    } finally {
      setCancelling(false);
    }
  }, [nearby]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await api.discoverMechanics();
      setAll(rows.map(normalizeMechanic));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mechanics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const rows = all
      .filter((m) => (onlyAvailable ? m.available : true))
      .filter((m) => m.rating >= minRating)
      .filter((m) =>
        q.trim()
          ? `${m.name} ${m.workshopName} ${m.specialization} ${m.skills} ${m.location}`.toLowerCase().includes(q.toLowerCase())
          : true,
      );
    return [...rows].sort((a, b) => {
      if (sort === 'price') return (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity);
      if (sort === 'reviews') return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
      return b.rating - a.rating;
    });
  }, [all, q, onlyAvailable, minRating, sort]);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Find Mechanics' }]} />
      <PageHeader title="Find Mechanics" subtitle="Discover verified, top-rated workshops near you" />

      {/* Roadside assistance: the primary action on this screen. The browse
          list below is unchanged — this sits above it, not inside it. */}
      <AnimatePresence mode="popLayout">
        {nearby.outcome && (
          <NearbyOutcomeBanner
            key={`outcome-${nearby.outcome.id}`}
            request={nearby.outcome}
            onDismiss={nearby.dismissOutcome}
            onRetry={() => {
              nearby.dismissOutcome();
              setDialogOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {nearby.request && !searching ? (
        <NearbyTracker
          request={nearby.request}
          onCancel={cancelRequest}
          cancelling={cancelling}
          onUpdated={nearby.setRequest}
        />
      ) : !nearby.request && !nearby.loading ? (
        <FindNearbyCta onClick={() => setDialogOpen(true)} />
      ) : null}

      <FindNearbyDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(r) => {
          setDialogOpen(false);
          nearby.setRequest(r);
        }}
      />

      <SearchingOverlay
        open={searching}
        onCancel={cancelRequest}
        cancelling={cancelling}
        issueLabel={nearby.request?.issueLabel}
        locationLabel={nearby.request?.userLocation?.label ?? undefined}
      />

      <h2 className="mb-3 font-display text-lg font-bold text-slate-900">Browse saved &amp; nearby workshops</h2>

      <Card className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input className={inputClass} placeholder="Search by name, specialization, city…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select
            className="sm:w-44"
            value={minRating}
            onChange={(v) => setMinRating(Number(v))}
            options={[
              { value: 0, label: 'Any rating' },
              { value: 4, label: '4★ & up' },
              { value: 4.5, label: '4.5★ & up' },
            ]}
          />
          <Select
            className="sm:w-48"
            value={sort}
            onChange={(v) => setSort(String(v))}
            options={[
              { value: 'rating', label: 'Sort: Top rated' },
              { value: 'reviews', label: 'Sort: Most reviewed' },
              { value: 'price', label: 'Sort: Lowest price' },
            ]}
          />
          <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded accent-indigo-600" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
            Available now
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-medium text-slate-400">Quick filters:</span>
          <Chip active={minRating === 4.5} onClick={() => setMinRating(minRating === 4.5 ? 0 : 4.5)}>⭐ 4.5+ rated</Chip>
          <Chip active={onlyAvailable} onClick={() => setOnlyAvailable((v) => !v)}>🟢 Available now</Chip>
          <Chip active={sort === 'price'} onClick={() => setSort(sort === 'price' ? 'rating' : 'price')}>💰 Best price</Chip>
        </div>
      </Card>

      {loading ? (
        <SkeletonCards count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <Empty title="No mechanics match" hint="Try widening your filters." icon="🔍" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => <VendorCard key={m.id} m={m} />)}
        </div>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Protected>
      <Suspense fallback={<Loading />}>
        <Discover />
      </Suspense>
    </Protected>
  );
}
