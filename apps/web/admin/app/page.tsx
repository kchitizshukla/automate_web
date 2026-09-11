'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency, formatDateTime, statusLabel } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { Loading, ErrorState, PageHeader, Card, StatCard, StatusBadge } from '@/components/ui';
import { FadeIn, CountUp } from '@/components/kit';
import { RevenueArea, BookingsBar, StatusDonut, HBar, bucketByMonth } from '@/components/charts';
import type { ServiceRow, PaymentRow, LogRow } from '@/lib/rows';
import { createdOf } from '@/lib/rows';

export default function DashboardPage() {
  const analytics = useApi(() => api.adminAnalytics(), []);
  const services = useApi(() => api.adminServices(), []);
  const payments = useApi(() => api.adminPayments(), []);
  const logs = useApi(() => api.adminLogs(), []);

  if (analytics.loading) return <Loading label="Loading analytics…" />;
  if (analytics.error) return <ErrorState message={analytics.error} onRetry={analytics.reload} />;

  const a = analytics.data ?? {};
  const n = (k: string) => Number((a as Record<string, unknown>)[k] ?? 0);

  const serviceRows = (services.data as unknown as ServiceRow[]) ?? [];
  const paymentRows = (payments.data as unknown as PaymentRow[]) ?? [];
  const logRows = (logs.data as unknown as LogRow[]) ?? [];

  // Revenue per month (paid payments only)
  const revenueData = bucketByMonth(
    paymentRows.filter((p) => String(p.status) === 'paid'),
    (p) => createdOf(p),
    (p) => Number(p.amount ?? 0),
  );
  // Bookings per month
  const bookingsData = bucketByMonth(serviceRows, (s) => createdOf(s), () => 1);

  // Services by status (donut)
  const byStatus = serviceRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const donutData = Object.entries(byStatus).map(([status, value]) => ({ name: statusLabel(status), value }));

  // Top service categories
  const byCat = serviceRows.reduce<Record<string, number>>((acc, r) => {
    const c = String(r.category ?? 'Other');
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});
  const catData = Object.entries(byCat).map(([name, value]) => ({ name, value })).sort((x, y) => y.value - x.value).slice(0, 6);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform overview, revenue and operations at a glance." />

      <FadeIn>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total revenue" value={<CountUp to={n('totalRevenue')} format={formatCurrency} />} icon="💰" accent="amber" trend="Collected to date" />
          <StatCard label="Total users" value={<CountUp to={n('totalUsers')} />} icon="👥" accent="indigo" trend="Registered customers" />
          <StatCard label="Mechanics" value={<CountUp to={n('totalMechanics')} />} icon="⚙️" accent="violet" trend={`${n('availableMechanics')} available now`} />
          <StatCard label="Total services" value={<CountUp to={n('totalServices')} />} icon="🛠" accent="sky" trend={`${n('completedServices')} completed`} />
        </div>
      </FadeIn>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <FadeIn delay={0.05} className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">Revenue trend</h2>
                <p className="text-xs text-slate-500">Last 6 months · paid transactions</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{formatCurrency(n('totalRevenue'))}</span>
            </div>
            <RevenueArea data={revenueData} />
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Services by status</h2>
            <p className="text-xs text-slate-500">Current distribution</p>
            {donutData.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-400">No service data yet.</p>
            ) : (
              <StatusDonut data={donutData} />
            )}
          </Card>
        </FadeIn>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <FadeIn delay={0.05}>
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Bookings per month</h2>
            <p className="mb-2 text-xs text-slate-500">Service requests created</p>
            <BookingsBar data={bookingsData} />
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Top service categories</h2>
            <p className="mb-2 text-xs text-slate-500">By number of bookings</p>
            {catData.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-400">No category data yet.</p>
            ) : (
              <HBar data={catData} />
            )}
          </Card>
        </FadeIn>
      </div>

      <FadeIn delay={0.05}>
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">Recent activity</h2>
            <Link href="/logs" className="text-sm font-semibold text-brand hover:underline">View all logs →</Link>
          </div>
          {logs.loading ? (
            <Loading label="Loading activity…" />
          ) : logRows.length === 0 ? (
            <Card className="p-6 text-sm text-slate-500">No recent activity.</Card>
          ) : (
            <Card className="divide-y divide-slate-100 p-0">
              {logRows.slice(0, 6).map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm">📌</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{String(l.action ?? 'Action')}</p>
                      <p className="truncate text-xs text-slate-500">{String(l.detail ?? '')}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{String(l.actor_role ?? l.actorRole ?? '—')}</span>
                    <span className="hidden text-xs text-slate-400 sm:block">{formatDateTime(createdOf(l))}</span>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
