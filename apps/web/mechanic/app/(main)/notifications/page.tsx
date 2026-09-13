'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Notification } from '@automate/shared-types';
import { formatDateTime, classNames } from '@automate/shared-utils';
import {
  loadNotifications,
  markNotificationRead,
  useNotifications,
} from '@/lib/notificationsStore';
import { Loading, ErrorState, Empty } from '@/components/ui';

export default function NotificationsPage() {
  // Shared with the header bell, so marking one read updates the badge too.
  const { items } = useNotifications();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: number) {
    try {
      await markNotificationRead(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }

  if (loading) return <Loading />;
  if (error && !items.length) return <ErrorState message={error} onRetry={load} />;

  const list = items;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      {error && <ErrorState message={error} />}
      {list.length === 0 ? (
        <Empty title="No notifications" hint="You're all caught up." />
      ) : (
        <div className="space-y-3">
          {list.map((n) => (
            <div
              key={n.id}
              className={classNames(
                'flex items-start justify-between gap-4 rounded-xl border p-4',
                n.read
                  ? 'border-gray-200 bg-white'
                  : 'border-emerald-200 bg-emerald-50',
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  )}
                  <p className="font-medium">{n.title}</p>
                </div>
                <p className="mt-0.5 text-sm text-gray-600">{n.body}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDateTime(n.createdAt)}
                </p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="shrink-0 text-sm font-medium text-emerald-600 hover:underline"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
