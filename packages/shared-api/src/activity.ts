// ──────────────────────────────────────────────
// API activity store.
//
// The ApiClient reports in-flight requests here; the global loader subscribes.
// Framework-agnostic on purpose — one implementation serves React DOM and
// React Native, so the loader behaves identically on all six apps.
// ──────────────────────────────────────────────

type Listener = (active: boolean, pending: number) => void;

export interface ApiActivity {
  /** Wire this straight into ClientOptions.onLoadingChange. */
  set(active: boolean, pending: number): void;
  subscribe(fn: Listener): () => void;
  isActive(): boolean;
  pendingCount(): number;
}

export function createApiActivity(): ApiActivity {
  const listeners = new Set<Listener>();
  let active = false;
  let pending = 0;

  return {
    set(next, count) {
      active = next;
      pending = count;
      // A throwing subscriber must never stop the others, and must never
      // leave the loader stuck on.
      listeners.forEach((fn) => {
        try {
          fn(active, pending);
        } catch {
          /* ignore */
        }
      });
    },
    subscribe(fn) {
      listeners.add(fn);
      // Emit current state immediately so a late subscriber is never out of sync.
      try {
        fn(active, pending);
      } catch {
        /* ignore */
      }
      return () => {
        listeners.delete(fn);
      };
    },
    isActive: () => active,
    pendingCount: () => pending,
  };
}
