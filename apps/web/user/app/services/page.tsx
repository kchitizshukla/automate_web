'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { vehicleDisplayName } from '@automate/shared-utils';
import { normalizeService, type ServiceRequestView } from '@/lib/normalize';
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

function Services() {
  const [services, setServices] = useState<ServiceRequestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setServices((await api.listServiceRequests()).map(normalizeService));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="My Services"
        subtitle="Track all your service requests"
        action={
          <Link href="/book">
            <Button>Book service</Button>
          </Link>
        }
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : services.length === 0 ? (
        <Empty title="No services yet" hint="Book your first service to see it here." />
      ) : (
        <Card className="divide-y divide-gray-100 p-0">
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/services/${s.id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">
                  {s.category}
                  {s.make && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      {s.vehicleCategoryIcon ?? ''} {vehicleDisplayName(s)}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  #{s.id} · {formatDate(s.createdAt)}
                  {s.price != null && ` · ${formatCurrency(s.price)}`}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}

export default function Page() {
  return (
    <Protected>
      <Services />
    </Protected>
  );
}
