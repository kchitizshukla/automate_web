'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { Card, Empty, ErrorState, PageHeader, SkeletonCards, StatCard, StatusBadge } from '@/components/ui';

interface PaymentRow {
  id: number;
  job_id?: number | null;
  customer_name?: string | null;
  amount: number;
  method?: string | null;
  status: string;
  transaction_ref?: string | null;
  created_at?: string;
}

export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows((await api.mechanicPayments()) as unknown as PaymentRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const paid = rows.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const pending = rows.filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <>
      <PageHeader title="Payments" subtitle="Your transaction records & payout status" />

      {loading ? (
        <SkeletonCards count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Received" value={formatCurrency(paid)} icon="✅" accent="emerald" trend="Settled payments" />
            <StatCard label="Pending" value={formatCurrency(pending)} icon="⏳" accent="amber" trend="Awaiting settlement" />
            <StatCard label="Transactions" value={rows.length} icon="🧾" accent="sky" />
          </div>

          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-bold text-slate-900">Transaction history</h2>
            {rows.length === 0 ? (
              <Empty title="No payments yet" hint="Payments appear here once jobs are billed." icon="💳" />
            ) : (
              <Card className="overflow-hidden p-0">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3 font-semibold">Txn Ref</th>
                        <th className="px-5 py-3 font-semibold">Customer</th>
                        <th className="px-5 py-3 font-semibold">Amount</th>
                        <th className="px-5 py-3 font-semibold">Method</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-mono text-xs font-medium text-slate-900">{p.transaction_ref ?? '—'}</td>
                          <td className="px-5 py-3">{p.customer_name ?? '—'}</td>
                          <td className="px-5 py-3 font-semibold">{formatCurrency(Number(p.amount))}</td>
                          <td className="px-5 py-3 uppercase">{p.method ?? '—'}</td>
                          <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                          <td className="px-5 py-3 text-slate-500">{formatDate(p.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </>
  );
}
