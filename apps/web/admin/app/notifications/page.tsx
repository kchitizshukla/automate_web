'use client';

import React, { useState } from 'react';
import { formatDateTime, classNames } from '@automate/shared-utils';
import type { Notification } from '@automate/shared-types';
import { api } from '@/lib/api';
import { createdOf } from '@/lib/rows';
import { useApi } from '@/lib/useApi';
import {
  Loading,
  ErrorState,
  Empty,
  PageHeader,
  Card,
} from '@/components/ui';

export default function NotificationsPage() {
  const { data, loading, error, reload } = useApi(
    () => api.listNotifications(),
    [],
  );
  const [busy, setBusy] = useState<number | null>(null);

  async function markRead(id: number) {
    setBusy(id);
    try {
      await api.markNotificationRead(id);
      reload();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Loading label="Loading notifications…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const items = (data as Notification[]) ?? [];
  const unread = items.filter((i) => !i.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread of ${items.length}.`}
      />
      {items.length === 0 ? (
        <Empty title="No notifications." />
      ) : (
        <div className="space-y-3">
          {items.map((nf) => (
            <Card
              key={nf.id}
              className={classNames(
                'flex items-start justify-between gap-4 p-4',
                !nf.read && 'border-l-4 border-l-indigo-500',
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{nf.title}</p>
                  {!nf.read && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{nf.body}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDateTime(createdOf(nf as any))}
                </p>
              </div>
              {!nf.read && (
                <button
                  onClick={() => markRead(nf.id)}
                  disabled={busy === nf.id}
                  className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {busy === nf.id ? '…' : 'Mark read'}
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
