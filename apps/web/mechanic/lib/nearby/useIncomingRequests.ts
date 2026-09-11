'use client';

// ──────────────────────────────────────────────
// The mechanic app's dispatch feed.
//
// Polls for live roadside requests and owns the alert-sound policy. The
// "have we already alerted for this request?" decision is made server-side
// (the `alerted` column), so a re-render, a refresh or a second tab cannot
// replay the tone for the same job.
// ──────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NearbyRequest } from '@automate/shared-types';
import { api } from '@/lib/api';
import { playIncomingAlert } from './notificationSound';

export const DISPATCH_POLL_MS = 3000;

export interface IncomingRequestsState {
  /** Requests still awaiting this mechanic's decision. */
  pending: NearbyRequest[];
  /** Accepted work in progress. */
  active: NearbyRequest[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  accept: (id: number) => Promise<NearbyRequest>;
  reject: (id: number, reason?: string) => Promise<NearbyRequest>;
}

export function useIncomingRequests(enabled = true): IncomingRequestsState {
  const [rows, setRows] = useState<NearbyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Requests this tab has already alerted for, so we do not even ask the
  // server twice within a session.
  const alertedRef = useRef<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const list = await api.mechanicNearbyRequests();
      setRows(list);
      setError(null);

      for (const r of list) {
        if (r.status !== 'PENDING_MECHANIC_RESPONSE') continue;
        if (alertedRef.current.has(r.id)) continue;
        alertedRef.current.add(r.id);
        // The server decides whether this is genuinely the first alert.
        try {
          const { firstAlert } = await api.markNearbyAlerted(r.id);
          if (firstAlert) playIncomingAlert();
        } catch {
          // Never let the alert bookkeeping break the feed.
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load incoming requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const id = setInterval(() => void refresh(), DISPATCH_POLL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  const accept = useCallback(
    async (id: number) => {
      const updated = await api.acceptNearbyRequest(id);
      // Optimistic swap so the panel closes immediately rather than on the
      // next poll tick.
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    [],
  );

  const reject = useCallback(async (id: number, reason?: string) => {
    const updated = await api.rejectNearbyRequest(id, reason);
    setRows((prev) => prev.filter((r) => r.id !== id));
    return updated;
  }, []);

  return {
    pending: rows.filter((r) => r.status === 'PENDING_MECHANIC_RESPONSE'),
    active: rows.filter((r) => r.status !== 'PENDING_MECHANIC_RESPONSE'),
    loading,
    error,
    refresh,
    accept,
    reject,
  };
}
