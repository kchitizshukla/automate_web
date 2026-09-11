'use client';

import React from 'react';
import { formatCurrency } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import {
  Loading,
  ErrorState,
  Empty,
  PageHeader,
  StatusBadge,
  TableWrap,
  Th,
  Td,
} from '@/components/ui';
import type { ServiceRow } from '@/lib/rows';
import { srId, mechId } from '@/lib/rows';

export default function ServicesPage() {
  const { data, loading, error, reload } = useApi(() => api.adminServices(), []);

  if (loading) return <Loading label="Loading services…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rows = (data as unknown as ServiceRow[]) ?? [];

  return (
    <div>
      <PageHeader title="Services" subtitle={`${rows.length} service request(s).`} />
      {rows.length === 0 ? (
        <Empty title="No service requests found." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Mechanic</Th>
              <Th>Price</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((s) => {
              const id = srId(s);
              const mid = mechId(s);
              return (
                <tr key={id} className="hover:bg-gray-50">
                  <Td className="font-medium text-gray-900">#{id}</Td>
                  <Td>{s.category ?? '—'}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td>{mid != null ? `#${mid}` : 'Unassigned'}</Td>
                  <Td>{s.price != null ? formatCurrency(Number(s.price)) : '—'}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
