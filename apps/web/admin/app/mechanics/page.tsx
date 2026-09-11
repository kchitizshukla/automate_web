'use client';

import React from 'react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { Loading, ErrorState, Empty, PageHeader, Avatar } from '@/components/ui';
import { Breadcrumbs, DataTable, type Column } from '@/components/kit';
import type { MechanicRow } from '@/lib/rows';
import { isAvailable, approvalOf } from '@/lib/rows';

const APPROVAL_TINT: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function MechanicsPage() {
  const { data, loading, error, reload } = useApi(() => api.adminMechanics(), []);

  if (loading) return <Loading label="Loading mechanics…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rows = (data as unknown as MechanicRow[]) ?? [];

  const columns: Column<MechanicRow>[] = [
    {
      key: 'name', header: 'Mechanic', sortValue: (m) => (m.name ?? '').toLowerCase(),
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={m.name} />
          <div>
            <p className="font-medium text-slate-900">{(m.workshop_name as string) ?? m.name ?? '—'}</p>
            <p className="text-xs text-slate-400">{m.email ?? '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'skills', header: 'Skills', render: (m) => <span className="block max-w-xs truncate">{m.skills || (m.specialization as string) || '—'}</span> },
    {
      key: 'available', header: 'Status', sortValue: (m) => (isAvailable(m) ? 1 : 0),
      render: (m) => (
        <span className={isAvailable(m) ? 'inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20' : 'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'}>
          <span className={isAvailable(m) ? 'h-1.5 w-1.5 rounded-full bg-green-500' : 'h-1.5 w-1.5 rounded-full bg-slate-400'} />
          {isAvailable(m) ? 'Available' : 'Busy'}
        </span>
      ),
    },
    { key: 'rating', header: 'Rating', sortValue: (m) => Number(m.rating ?? 0), render: (m) => (m.rating != null ? `${Number(m.rating).toFixed(1)} ★` : '—') },
    {
      key: 'approval', header: 'Approval', sortValue: (m) => approvalOf(m),
      render: (m) => <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${APPROVAL_TINT[approvalOf(m)] ?? 'bg-gray-100 text-gray-700'}`}>{approvalOf(m)}</span>,
    },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Mechanics' }]} />
      <PageHeader title="Mechanics" subtitle={`${rows.length} registered workshop(s).`} />
      {rows.length === 0 ? (
        <Empty title="No mechanics found." />
      ) : (
        <DataTable rows={rows} columns={columns} searchKeys={['name', 'email', 'skills']} searchPlaceholder="Search mechanics…" rowKey={(m) => m.id} />
      )}
    </div>
  );
}
