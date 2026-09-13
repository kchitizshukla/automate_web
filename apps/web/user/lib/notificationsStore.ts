'use client';

/* ──────────────────────────────────────────────
   Notifications — one copy of the server state.

   The header bell and the /notifications page both render the unread count.
   They each used to hold their own useState copy, loaded independently, so
   marking a notification read on the page updated that page but left the
   bell's badge showing the old number until a full reload — the button
   vanished, the count did not move.

   Both now read from this store, so a change made in either place is
   reflected everywhere on the same tick.
   ────────────────────────────────────────────── */

import { useSyncExternalStore } from 'react';
import type { Notification } from '@automate/shared-types';
import { api } from '@/lib/api';
import { normalizeNotification } from '@/lib/normalize';

type Listener = () => void;

const EMPTY: Notification[] = [];

let items: Notification[] = EMPTY;
let inFlight: Promise<void> | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

/** Replace the list. The reference must change for useSyncExternalStore. */
function setItems(next: Notification[]) {
  items = next;
  emit();
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const getSnapshot = () => items;
// Server render has no data; a stable reference keeps React from looping.
const getServerSnapshot = () => EMPTY;

/**
 * Fetch the list. Concurrent callers (bell + page mounting together) share one
 * request rather than racing two.
 */
export async function loadNotifications(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const rows = await api.listNotifications();
      setItems(rows.map(normalizeNotification));
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Mark one read on the server, then reflect it locally. */
export async function markNotificationRead(id: number): Promise<void> {
  await api.markNotificationRead(id);
  setItems(items.map((n) => (n.id === id ? { ...n, read: true } : n)));
}

/**
 * Mark every unread one read. The local list flips first so the UI responds
 * immediately; a failure re-reads the server rather than leaving a lie on
 * screen.
 */
export async function markAllNotificationsRead(): Promise<number> {
  const ids = items.filter((n) => !n.read).map((n) => n.id);
  if (!ids.length) return 0;
  setItems(items.map((n) => ({ ...n, read: true })));
  try {
    await Promise.all(ids.map((id) => api.markNotificationRead(id)));
  } catch (err) {
    await loadNotifications();
    throw err;
  }
  return ids.length;
}

/** Subscribe a component to the shared list. */
export function useNotifications() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { items: list, unread: list.filter((n) => !n.read).length };
}
