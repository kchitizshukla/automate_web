'use client';

import React from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { formatCurrency, formatDate } from '@automate/shared-utils';
import { Loading, ErrorState, Empty, PageHeader, StatusBadge, StatCard, TableWrap, Th, Td } from '@/components/ui';
import type { PaymentRow } from '@/lib/rows';
import { createdOf } from '@/lib/rows';

export default function PaymentsPage() {
  const payments = useApi(() => api.adminPayments(), []);
  const recon = useApi(() => api.adminReconciliation(), []);

  if (payments.loading || recon.loading) return <Loading label="Loading reconciliation…" />;
  if (payments.error) return <ErrorState message={payments.error} onRetry={payments.reload} />;

  const rows = (payments.data as unknown as PaymentRow[]) ?? [];
  const r = (recon.data as unknown as Record<string, number>) ?? {};

  return (
    <>
      <PageHeader title="Payments & Reconciliation" subtitle="Platform-wide financial overview" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Collected" value={formatCurrency(r.collected ?? 0)} icon="💰" accent="emerald" />
        <StatCard label="Pending" value={formatCurrency(r.pending ?? 0)} icon="⏳" accent="amber" />
        <StatCard label="Refunded" value={formatCurrency(r.refunded ?? 0)} icon="↩️" accent="violet" />
        <StatCard label="Transactions" value={r.transactions ?? 0} icon="🧾" accent="sky" />
        <StatCard label="Payout due" value={formatCurrency(r.payoutDue ?? 0)} icon="🏦" accent="indigo" />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold text-slate-900">All transactions</h2>
        {rows.length === 0 ? (
          <Empty title="No transactions yet" icon="🧾" />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Txn Ref</Th>
                <Th>Customer</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <Td className="font-mono text-xs font-medium text-slate-900">{p.transaction_ref ?? p.transactionRef ?? '—'}</Td>
                  <Td>{p.user_name ?? p.userName ?? '—'}</Td>
                  <Td className="font-semibold">{p.amount != null ? formatCurrency(Number(p.amount)) : '—'}</Td>
                  <Td className="uppercase">{p.method ?? '—'}</Td>
                  <Td>{p.status ? <StatusBadge status={p.status} /> : '—'}</Td>
                  <Td>{formatDate(createdOf(p))}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </div>
    </>
  );
}
