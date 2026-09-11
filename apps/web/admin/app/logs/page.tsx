'use client';

import React from 'react';
import { formatDateTime } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import {
  Loading,
  ErrorState,
  Empty,
  PageHeader,
  TableWrap,
  Th,
  Td,
} from '@/components/ui';
import type { LogRow } from '@/lib/rows';
import { createdOf } from '@/lib/rows';

export default function LogsPage() {
  const { data, loading, error, reload } = useApi(() => api.adminLogs(), []);

  if (loading) return <Loading label="Loading logs…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  // Backend already orders newest first; sort defensively by created date too.
  const rows = [...((data as unknown as LogRow[]) ?? [])].sort((a, b) => {
    const ca = createdOf(a) ?? '';
    const cb = createdOf(b) ?? '';
    return cb.localeCompare(ca);
  });

  return (
    <div>
      <PageHeader title="System Logs" subtitle={`${rows.length} event(s).`} />
      {rows.length === 0 ? (
        <Empty title="No log entries yet." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Detail</Th>
              <Th>When</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((l) => {
              const created = createdOf(l);
              const role = l.actor_role ?? l.actorRole ?? '—';
              return (
                <tr key={l.id} className="hover:bg-gray-50">
                  <Td className="font-medium capitalize text-gray-900">{role}</Td>
                  <Td>{l.action ?? '—'}</Td>
                  <Td className="max-w-md truncate text-gray-500">
                    {l.detail ?? '—'}
                  </Td>
                  <Td>{created ? formatDateTime(created) : '—'}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
