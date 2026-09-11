'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Review } from '@automate/shared-types';
import { formatDate } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { Card, Empty, ErrorState, PageHeader, Loading, Stars, Avatar } from '@/components/ui';

type Row = Record<string, any>;
function norm(r: Row): Review {
  return {
    id: Number(r.id),
    serviceRequestId: Number(r.service_request_id ?? r.serviceRequestId ?? 0),
    mechanicId: Number(r.mechanic_id ?? r.mechanicId ?? 0),
    userId: Number(r.user_id ?? r.userId ?? 0),
    userName: r.user_name ?? r.userName,
    rating: Number(r.rating),
    comment: r.comment ?? null,
    createdAt: r.created_at ?? r.createdAt,
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = (await api.mechanicReviews()) as unknown as Row[];
      setReviews(rows.map(norm));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <>
      <PageHeader
        title="Client Reviews"
        subtitle="What customers say about your work"
        action={
          reviews.length ? (
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2 ring-1 ring-slate-200">
              <span className="font-display text-2xl font-bold text-slate-900">{avg.toFixed(1)}</span>
              <div>
                <Stars value={avg} />
                <p className="text-xs text-slate-400">{reviews.length} reviews</p>
              </div>
            </div>
          ) : undefined
        }
      />
      {loading ? (
        <Loading label="Loading reviews…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : reviews.length === 0 ? (
        <Empty title="No reviews yet" hint="Complete jobs to start receiving client feedback." icon="⭐" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.userName} />
                  <p className="font-semibold text-slate-800">{r.userName ?? 'Customer'}</p>
                </div>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="mt-3 text-sm text-slate-600">“{r.comment}”</p>}
              <p className="mt-3 text-xs text-slate-400">{formatDate(r.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
