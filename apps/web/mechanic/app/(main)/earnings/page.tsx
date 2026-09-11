'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Earnings } from '@automate/shared-types';
import { formatCurrency } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { Card, ErrorState, PageHeader, SkeletonCards, StatCard, Stars, Empty } from '@/components/ui';
import { CountUp } from '@/components/kit';

export default function EarningsPage() {
  const [data, setData] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.mechanicEarnings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const maxMonthly = data?.monthly?.reduce((m, x) => Math.max(m, x.amount), 0) || 1;

  return (
    <>
      <PageHeader title="Earnings" subtitle="Track your payouts and performance" />
      {loading ? (
        <SkeletonCards count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total earned" value={<CountUp to={data.totalEarned} format={formatCurrency} />} icon="💰" accent="emerald" trend="Completed & paid" />
            <StatCard label="Pending payout" value={<CountUp to={data.pendingPayout} format={formatCurrency} />} icon="⏳" accent="amber" trend="In progress" />
            <StatCard label="Completed jobs" value={<CountUp to={data.completedJobs} />} icon="✅" accent="sky" />
            <StatCard label="Avg. rating" value={<CountUp to={data.averageRating} decimals={1} />} icon="⭐" accent="violet" trend="From client reviews" />
          </div>

          <Card className="mt-6">
            <h3 className="font-display font-bold text-slate-900">Monthly revenue</h3>
            {data.monthly?.length ? (
              <div className="mt-5 flex items-end gap-4" style={{ height: 180 }}>
                {data.monthly.map((m, i) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">{formatCurrency(m.amount)}</span>
                    <div className="flex w-full items-end justify-center" style={{ height: 120 }}>
                      <motion.div
                        className="w-full max-w-[56px] rounded-t-lg bg-aurora"
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(8, (m.amount / maxMonthly) * 120)}px` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{m.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No revenue recorded yet.</p>
            )}
          </Card>

          <div className="mt-6 flex items-center gap-3">
            <Stars value={data.averageRating} size="lg" />
            <span className="text-sm text-slate-500">Your average client rating</span>
          </div>
        </>
      ) : (
        <Empty title="No earnings data" icon="💰" />
      )}
    </>
  );
}
