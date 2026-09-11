'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — selected-role context

   The chosen segment is kept in React state and mirrored
   to localStorage so a returning visitor lands on their
   own flow, and so the role apps can read it after the
   cross-origin hand-off falls back to a fresh page load.
   ────────────────────────────────────────────── */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ROLE_STORAGE_KEY, isRoleId, type RoleId } from '@automate/shared-brand';

interface RoleContextValue {
  role: RoleId | null;
  selectRole: (role: RoleId) => void;
  clearRole: () => void;
  /** False until localStorage has been read (avoids an SSR/CSR mismatch). */
  ready: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  selectRole: () => undefined,
  clearRole: () => undefined,
  ready: false,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<RoleId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ROLE_STORAGE_KEY);
      if (isRoleId(stored)) setRole(stored);
    } catch {
      /* private mode / storage disabled — the in-memory value still works */
    }
    setReady(true);
  }, []);

  const selectRole = useCallback((next: RoleId) => {
    setRole(next);
    try {
      window.localStorage.setItem(ROLE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const clearRole = useCallback(() => {
    setRole(null);
    try {
      window.localStorage.removeItem(ROLE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ role, selectRole, clearRole, ready }),
    [role, selectRole, clearRole, ready],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  return useContext(RoleContext);
}
