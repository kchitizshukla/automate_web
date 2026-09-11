'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { formatDateTime, classNames } from '@automate/shared-utils';
import type { Notification } from '@automate/shared-types';
import { api } from '@/lib/api';
import { normalizeNotification } from '@/lib/normalize';
import { Protected } from '@/components/Protected';
import {
  Card,
  Empty,
  ErrorState,
  Loading,
  PageHeader,
} from '@/components/ui';

function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems((await api.listNotifications()).map(normalizeNotification));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load notifications',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: number) {
    setMarking(id);
    try {
      await api.markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark read');
    } finally {
      setMarking(null);
    }
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'You are all caught up'}
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <Empty title="No notifications" hint="Updates will appear here." />
      ) : (
        <Card className="divide-y divide-gray-100 p-0">
          {items.map((n) => (
            <div
              key={n.id}
              className={classNames(
                'flex items-start justify-between gap-3 px-5 py-4',
                !n.read && 'bg-blue-50/50',
              )}
            >
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-brand" />
                  )}
                  {n.title}
                </p>
                <p className="mt-0.5 text-sm text-gray-600">{n.body}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDateTime(n.createdAt)}
                </p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  disabled={marking === n.id}
                  className="shrink-0 text-sm font-medium text-brand hover:underline disabled:opacity-50"
                >
                  {marking === n.id ? '…' : 'Mark read'}
                </button>
              )}
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
      <Notifications />
    </Protected>
  );
}
