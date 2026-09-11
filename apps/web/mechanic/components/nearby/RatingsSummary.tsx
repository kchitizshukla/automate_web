'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MechanicRatingsResponse } from '@automate/shared-types';
import { formatDateTime, ratingShare } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { Stars, Avatar } from '@/components/ui';

const STARS = [5, 4, 3, 2, 1] as const;

/**
 * Customer ratings for the signed-in mechanic. Every number here is derived
 * from the rating records on each request — nothing is a stored constant, so
 * the profile cannot drift from the actual reviews.
 */
export function RatingsSummary({ pollMs = 15000 }: { pollMs?: number }) {
  const reduce = useReducedMotion();
  const [data, setData] = useState<MechanicRatingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(await api.mechanicRatings());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your ratings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // A new rating lands without the mechanic having to refresh the page.
  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => void load(), pollMs);
    return () => clearInterval(id);
  }, [pollMs, load]);

  if (loading) {
    return (
      <section className="card">
        <h2 className="mb-3 font-display text-lg font-bold text-slate-900">Customer Ratings</h2>
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="card">
        <h2 className="mb-2 font-display text-lg font-bold text-slate-900">Customer Ratings</h2>
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={() => void load()} className="mt-2 text-sm font-semibold text-indigo-600 hover:underline">
          Try again
        </button>
      </section>
    );
  }

  const summary = data ?? { average: null, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, reviews: [] };

  if (!summary.total) {
    return (
      <section className="card">
        <h2 className="mb-2 font-display text-lg font-bold text-slate-900">Customer Ratings</h2>
        <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
          <p aria-hidden className="text-3xl">⭐</p>
          <p className="mt-1 font-semibold text-slate-700">No ratings yet</p>
          <p className="text-sm text-slate-500">Complete roadside jobs to start collecting customer feedback.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 className="mb-3 font-display text-lg font-bold text-slate-900">Customer Ratings</h2>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="shrink-0 text-center sm:w-40">
          <p className="font-display text-4xl font-extrabold tabular-nums text-slate-900">
            {summary.average?.toFixed(1)} <span className="text-2xl text-amber-400">★</span>
          </p>
          <div className="mt-1 flex justify-center">
            <Stars value={summary.average ?? 0} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Based on {summary.total} {summary.total === 1 ? 'rating' : 'ratings'}
          </p>
        </div>

        <div className="flex-1 space-y-1.5">
          {STARS.map((star) => {
            const count = summary.distribution[star] ?? 0;
            const share = ratingShare(summary.distribution, star);
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-8 shrink-0 tabular-nums text-slate-500">{star} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-amber-400"
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${Math.round(share * 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right tabular-nums text-slate-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {summary.reviews.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Recent reviews</h3>
          <ul className="space-y-3">
            {summary.reviews.slice(0, 5).map((r) => (
              <li key={r.id} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {/* Display name only — no contact details are surfaced here. */}
                    <Avatar name={r.userName ?? 'Customer'} />
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {r.userName ?? 'Customer'}
                    </span>
                  </div>
                  <Stars value={r.rating} />
                </div>
                {r.review && <p className="mt-2 text-sm text-slate-600">“{r.review}”</p>}
                <p className="mt-1.5 text-xs text-slate-400">{formatDateTime(r.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
