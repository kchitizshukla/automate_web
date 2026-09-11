'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Job, Earnings } from '@automate/shared-types';
import { formatCurrency, formatDateTime, statusLabel } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { Card, Empty, ErrorState, SkeletonCards, StatCard, StatusBadge } from '@/components/ui';
import { FadeIn } from '@/components/kit';
import { EarningsArea, JobsDonut } from '@/components/charts';

const HERO_IMG = 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=1400&q=60';

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [j, p, e] = await Promise.all([api.listJobs(), api.getProfile(), api.mechanicEarnings()]);
      setJobs(j);
      setProfile(p);
      setEarnings(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const assigned = jobs.filter((j) => j.status === 'assigned').length;
  const inProgress = jobs.filter((j) => j.status === 'in_progress' || j.status === 'accepted').length;
  const completed = jobs.filter((j) => j.status === 'completed').length;
  const available = Boolean(profile?.available);
  const name = (profile?.name as string) ?? 'Mechanic';
  const recent = jobs.slice(0, 5);

  const donutData = useMemo(() => {
    const by = jobs.reduce<Record<string, number>>((acc, j) => { acc[j.status] = (acc[j.status] ?? 0) + 1; return acc; }, {});
    return Object.entries(by).map(([status, value]) => ({ name: statusLabel(status), value }));
  }, [jobs]);

  return (
    <>
      <div className="relative mb-7 overflow-hidden rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url('${HERO_IMG}')` }} />
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(110deg, rgba(15,23,42,0.95) 35%, rgba(16,185,129,0.5) 80%, rgba(6,182,212,0.45))' }} />
        <FadeIn className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-300">Welcome back, {name.split(' ')[0]} 👋</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Your workshop, <span className="text-gradient">at a glance.</span></h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/jobs" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">View jobs →</Link>
              <Link href="/earnings" className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">Earnings</Link>
            </div>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ${available ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-300'}`}>
            <span className={`h-2 w-2 rounded-full ${available ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            {available ? 'Available for jobs' : 'Currently unavailable'}
          </span>
        </FadeIn>
      </div>

      {loading ? (
        <SkeletonCards count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <FadeIn>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Requests" value={assigned} icon="📥" accent="amber" trend="Awaiting your response" />
              <StatCard label="Active" value={inProgress} icon="⚙️" accent="sky" trend="Currently working" />
              <StatCard label="Completed" value={completed} icon="✅" accent="emerald" trend="Lifetime jobs" />
              <StatCard label="Total earned" value={formatCurrency(earnings?.totalEarned ?? 0)} icon="💰" accent="violet" trend={`${formatCurrency(earnings?.pendingPayout ?? 0)} pending`} />
            </div>
          </FadeIn>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <FadeIn delay={0.05} className="lg:col-span-2">
              <Card className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900">Earnings trend</h2>
                    <p className="text-xs text-slate-500">Monthly payouts</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">★ {(earnings?.averageRating ?? 0).toFixed(1)}</span>
                </div>
                {earnings?.monthly?.length ? <EarningsArea data={earnings.monthly} /> : <p className="py-16 text-center text-sm text-slate-400">No earnings data yet.</p>}
              </Card>
            </FadeIn>
            <FadeIn delay={0.1}>
              <Card className="p-6">
                <h2 className="font-display text-lg font-bold text-slate-900">Jobs by status</h2>
                <p className="text-xs text-slate-500">Your current workload</p>
                {donutData.length ? <JobsDonut data={donutData} /> : <p className="py-16 text-center text-sm text-slate-400">No jobs yet.</p>}
              </Card>
            </FadeIn>
          </div>

          <FadeIn delay={0.05}>
            <div className="mt-6 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">Recent jobs</h2>
              <Link href="/jobs" className="text-sm font-semibold text-brand hover:underline">View all →</Link>
            </div>
            <div className="mt-3">
              {recent.length === 0 ? (
                <Empty title="No jobs yet" hint="Assigned jobs will appear here." icon="🔧" />
              ) : (
                <Card className="divide-y divide-slate-100 p-0">
                  {recent.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50/80">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-lg">🔧</span>
                        <div>
                          <p className="font-semibold text-slate-800">Job #{job.id}</p>
                          <p className="text-xs text-slate-500">Updated {formatDateTime(job.updatedAt)}</p>
                        </div>
                      </div>
                      <StatusBadge status={job.status} />
                    </Link>
                  ))}
                </Card>
              )}
            </div>
          </FadeIn>
        </>
      )}
    </>
  );
}
