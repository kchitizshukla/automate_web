'use client';

import React from 'react';
import { formatDate } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { Loading, ErrorState, Empty, PageHeader, StatusBadge, Avatar } from '@/components/ui';
import { Breadcrumbs, DataTable, type Column } from '@/components/kit';
import type { UserRow } from '@/lib/rows';
import { createdOf } from '@/lib/rows';

export default function UsersPage() {
  const { data, loading, error, reload } = useApi(() => api.adminUsers(), []);

  if (loading) return <Loading label="Loading users…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rows = (data as unknown as UserRow[]) ?? [];

  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (u) => (u.name ?? '').toLowerCase(),
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={u.name} />
          <span className="font-medium text-slate-900">{u.name ?? '—'}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email', sortValue: (u) => (u.email ?? '').toLowerCase(), render: (u) => u.email ?? '—' },
    { key: 'phone', header: 'Phone', render: (u) => u.phone ?? '—' },
    { key: 'status', header: 'Status', sortValue: (u) => u.status ?? '', render: (u) => (u.status ? <StatusBadge status={u.status} /> : '—') },
    { key: 'created', header: 'Joined', sortValue: (u) => createdOf(u) ?? '', render: (u) => { const c = createdOf(u); return c ? formatDate(c) : '—'; } },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Users' }]} />
      <PageHeader title="Users" subtitle={`${rows.length} managed customer account(s).`} />
      {rows.length === 0 ? (
        <Empty title="No users found." />
      ) : (
        <DataTable rows={rows} columns={columns} searchKeys={['name', 'email', 'phone']} searchPlaceholder="Search users…" rowKey={(u) => u.id} />
      )}
    </div>
  );
}
