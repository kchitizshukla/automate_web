'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { formatCurrency, formatDateTime } from '@automate/shared-utils';
import type { Payment } from '@automate/shared-types';
import { api } from '@/lib/api';
import {
  normalizePayment,
  normalizeService,
  type ServiceRequestView,
} from '@/lib/normalize';
import { Protected } from '@/components/Protected';
import {
  Button,
  Card,
  Empty,
  ErrorState,
  Loading,
  PageHeader,
  StatusBadge,
} from '@/components/ui';

function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [services, setServices] = useState<ServiceRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [p, s] = await Promise.all([
        api.listPayments(),
        api.listServiceRequests(),
      ]);
      setPayments(p.map(normalizePayment));
      setServices(s.map(normalizeService));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function pay(serviceRequestId: number) {
    setPayingId(serviceRequestId);
    setActionError('');
    try {
      await api.payForService(serviceRequestId, 'card');
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPayingId(null);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const paidServiceIds = new Set(
    payments.filter((p) => p.status === 'paid').map((p) => p.serviceRequestId),
  );
  const due = services.filter(
    (s) => s.price != null && s.price > 0 && !paidServiceIds.has(s.id),
  );

  return (
    <>
      <PageHeader title="Payments" subtitle="Pay for services and view history" />

      {actionError && (
        <p className="mb-4 text-sm text-red-600">{actionError}</p>
      )}

      <h2 className="mb-3 text-lg font-semibold">Due</h2>
      {due.length === 0 ? (
        <Empty title="Nothing due" hint="You have no pending payments." />
      ) : (
        <Card className="mb-8 divide-y divide-gray-100 p-0">
          {due.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"
            >
              <div>
                <p className="font-medium">
                  {s.category}{' '}
                  <span className="text-sm font-normal text-gray-500">
                    #{s.id}
                  </span>
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(s.price as number)}
                </p>
              </div>
              <Button
                onClick={() => pay(s.id)}
                disabled={payingId === s.id}
              >
                {payingId === s.id ? 'Processing…' : 'Pay now'}
              </Button>
            </div>
          ))}
        </Card>
      )}

      <h2 className="mb-3 text-lg font-semibold">History</h2>
      {payments.length === 0 ? (
        <Empty title="No payments yet" hint="Your payment history will appear here." />
      ) : (
        <Card className="divide-y divide-gray-100 p-0">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"
            >
              <div>
                <p className="font-medium">{formatCurrency(p.amount)}</p>
                <p className="text-sm text-gray-500">
                  Service #{p.serviceRequestId} · {p.method} ·{' '}
                  {formatDateTime(p.createdAt)}
                </p>
                <p className="font-mono text-xs text-gray-400">
                  {p.transactionRef}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Protected>
      <Payments />
    </Protected>
  );
}
