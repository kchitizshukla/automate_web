'use client';

// ──────────────────────────────────────────────
// The user app's single source of truth for the live roadside request.
//
// Every screen that cares about the request reads this hook rather than
// deriving status independently. Polling stands in for websockets — swapping
// in a socket means replacing the interval here and nothing else.
// ──────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NearbyRequest, NearbyRequestStatus } from '@automate/shared-types';
import { ACTIVE_NEARBY_STATUSES, TERMINAL_NEARBY_STATUSES } from '@automate/shared-types';
import { api } from '@/lib/api';

/** How often to ask the backend for the current state, per phase. */
export const POLL_MS = {
  /** Waiting on a mechanic: the user is staring at the screen, so poll fast. */
  awaitingResponse: 2000,
  /** En route: the ETA is what moves, and it moves by the minute. */
  enRoute: 4000,
} as const;

export interface NearbyRequestState {
  request: NearbyRequest | null;
  loading: boolean;
  error: string | null;
  /** Terminal outcome the user has not dismissed yet (rejected, no mechanic…). */
  outcome: NearbyRequest | null;
  refresh: () => Promise<NearbyRequest | null>;
  setRequest: (r: NearbyRequest | null) => void;
  cancel: () => Promise<void>;
  dismissOutcome: () => void;
}

/** A rejection or timeout this recent is still news to the user. */
export const UNSEEN_OUTCOME_WINDOW_MS = 15 * 60 * 1000;

export function isActive(status: NearbyRequestStatus | undefined | null): boolean {
  return !!status && ACTIVE_NEARBY_STATUSES.includes(status);
}

export function isTerminal(status: NearbyRequestStatus | undefined | null): boolean {
  return !!status && TERMINAL_NEARBY_STATUSES.includes(status);
}

export function useNearbyRequest(): NearbyRequestState {
  const [request, setRequest] = useState<NearbyRequest | null>(null);
  const [outcome, setOutcome] = useState<NearbyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Held in refs so the polling effect never needs them as dependencies.
  const dismissedRef = useRef<number | null>(null);
  const requestRef = useRef<NearbyRequest | null>(null);
  const firstLoadRef = useRef(true);
  requestRef.current = request;

  const refresh = useCallback(async () => {
    try {
      const active = await api.activeNearbyRequest();
      setError(null);

      if (active) {
        setRequest(active);
        return active;
      }

      // Nothing live. Two cases need the outcome banner:
      //  1. we were tracking a request that has just ended, and
      //  2. a first load after the user navigated away (or reloaded) while a
      //     request was still open — otherwise a rejection or timeout would
      //     vanish silently and the user would never learn what happened.
      const previous = requestRef.current;
      const wasTracking = previous && !isTerminal(previous.status);
      const coldStart = firstLoadRef.current;
      firstLoadRef.current = false;
      setRequest(null);

      if (wasTracking || coldStart) {
        const latest = await api.latestNearbyRequest();
        if (latest && isTerminal(latest.status) && dismissedRef.current !== latest.id) {
          // On a cold start only surface a genuinely recent outcome, so an
          // old completed job does not greet the user days later.
          const ageMs = Date.now() - new Date(latest.updatedAt).getTime();
          const worthShowing =
            wasTracking ||
            (ageMs < UNSEEN_OUTCOME_WINDOW_MS && latest.status !== 'COMPLETED' && latest.status !== 'CANCELLED');
          if (worthShowing) setOutcome(latest);
        }
        return latest;
      }
      return null;
    } catch (err) {
      // A transient network blip should not wipe a tracked request off screen.
      setError(err instanceof Error ? err.message : 'Could not reach the server');
      return requestRef.current;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Poll only while something is actually in flight.
  useEffect(() => {
    if (!isActive(request?.status)) return;
    const interval =
      request?.status === 'PENDING_MECHANIC_RESPONSE' || request?.status === 'SEARCHING'
        ? POLL_MS.awaitingResponse
        : POLL_MS.enRoute;
    const id = setInterval(() => void refresh(), interval);
    return () => clearInterval(id);
  }, [request?.status, refresh]);

  const cancel = useCallback(async () => {
    const current = requestRef.current;
    if (!current) return;
    const updated = await api.cancelNearbyRequest(current.id);
    dismissedRef.current = updated.id; // cancelling is its own confirmation
    setRequest(null);
    setOutcome(null);
  }, []);

  const dismissOutcome = useCallback(() => {
    if (outcome) dismissedRef.current = outcome.id;
    setOutcome(null);
  }, [outcome]);

  return { request, loading, error, outcome, refresh, setRequest, cancel, dismissOutcome };
}
