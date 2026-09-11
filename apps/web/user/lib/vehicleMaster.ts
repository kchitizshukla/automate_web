'use client';

// ──────────────────────────────────────────────
// Vehicle master data — client-side plumbing.
//
// This file holds no vehicle data of its own. It fetches the taxonomy from the
// user backend one dependent level at a time, and adds the things every
// dropdown needs: a session cache, debounced server-side search, pagination,
// and explicit loading / empty / error states.
//
// Adding a vehicle type, manufacturer, model or variant to the database makes
// it selectable here on the next request — nothing in this file changes.
// ──────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  MasterPage,
  RegistrationRule,
  VehicleCategory,
  VehicleFuelType,
  VehicleManufacturer,
  VehicleModel,
  VehicleType,
  VehicleVariant,
} from '@automate/shared-types';
import { api } from '@/lib/api';

/** Mirrors the backend sentinel for the "Other / Not listed" escape hatch. */
export const OTHER_OPTION_ID = -1;

export const isOther = (id: number | null | undefined) => id === OTHER_OPTION_ID;

/* ── Session cache ────────────────────────────
   Master data barely changes, and the picker walks back and forth through it.
   Caching the in-flight promise (not just the result) also collapses the
   duplicate requests two sibling dropdowns would otherwise fire on mount. */
const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const p = load().catch((err) => {
    // A failed request must not be cached, or Retry could never work.
    cache.delete(key);
    throw err;
  });
  cache.set(key, p);
  return p;
}

/** Drops the cache so the next render refetches — used by Retry. */
export function clearVehicleMasterCache() {
  cache.clear();
}

const message = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

/* ── Bootstrap: types, fuel types, registration rules ── */

export interface VehicleMasterState {
  types: VehicleType[];
  fuelTypes: VehicleFuelType[];
  rules: RegistrationRule[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useVehicleMaster(): VehicleMasterState {
  const [types, setTypes] = useState<VehicleType[]>([]);
  const [fuelTypes, setFuelTypes] = useState<VehicleFuelType[]>([]);
  const [rules, setRules] = useState<RegistrationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    cached('master', () => api.vehicleMaster())
      .then((m) => {
        if (!alive) return;
        setTypes(m.types ?? []);
        setFuelTypes(m.fuelTypes ?? []);
        setRules(m.registrationRules ?? []);
      })
      .catch((err) => alive && setError(message(err, 'Could not load vehicle options')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [nonce]);

  const reload = useCallback(() => {
    cache.delete('master');
    setNonce((n) => n + 1);
  }, []);

  return { types, fuelTypes, rules, loading, error, reload };
}

/* ── Dependent lists ──────────────────────────── */

export interface MasterListState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  /** True while a `loadMore()` page is in flight. */
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  /** Current search term; setting it refetches after a debounce. */
  search: string;
  setSearch: (term: string) => void;
  reload: () => void;
}

const DEBOUNCE_MS = 280;

/**
 * One dependent dropdown's worth of state.
 *
 * `enabled` is how the cascade works: a level stays idle (and shows its
 * "choose the level above first" empty state) until its parent is picked.
 * Only unsearched first pages are cached — a search is a one-off.
 */
function useMasterList<T>(
  cacheKey: string | null,
  load: (opts: { q: string; page: number }) => Promise<MasterPage<T>>,
  enabled: boolean,
): MasterListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearchRaw] = useState('');
  const [debounced, setDebounced] = useState('');
  const [nonce, setNonce] = useState(0);
  // Guards against a slow earlier request overwriting a newer one.
  const requestRef = useRef(0);

  const setSearch = useCallback((term: string) => {
    setSearchRaw(term);
    setPage(1);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [search]);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setError(null);
      setHasMore(false);
      return;
    }
    const seq = ++requestRef.current;
    const first = page === 1;
    if (first) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const run = () => loadRef.current({ q: debounced, page });
    const p =
      cacheKey && !debounced && first ? cached(`${cacheKey}:1`, run) : run();

    p.then((res) => {
      if (seq !== requestRef.current) return;
      setItems((prev) => (first ? res.items : [...prev, ...res.items]));
      setHasMore(!!res.hasMore);
    })
      .catch((err) => {
        if (seq !== requestRef.current) return;
        setError(message(err, 'Could not load options'));
        if (first) setItems([]);
      })
      .finally(() => {
        if (seq !== requestRef.current) return;
        setLoading(false);
        setLoadingMore(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled, debounced, page, nonce]);

  const loadMore = useCallback(() => setPage((p) => p + 1), []);
  const reload = useCallback(() => {
    if (cacheKey) cache.delete(`${cacheKey}:1`);
    setPage(1);
    setNonce((n) => n + 1);
  }, [cacheKey]);

  return { items, loading, loadingMore, error, hasMore, loadMore, search, setSearch, reload };
}

export function useVehicleCategories(typeId: number | null) {
  const [items, setItems] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (typeId == null) {
      setItems([]);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    cached(`categories:${typeId}`, () => api.vehicleCategories(typeId))
      .then((rows) => alive && setItems(rows))
      .catch((err) => {
        if (!alive) return;
        setError(message(err, 'Could not load vehicle categories'));
        setItems([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [typeId, nonce]);

  const reload = useCallback(() => {
    if (typeId != null) cache.delete(`categories:${typeId}`);
    setNonce((n) => n + 1);
  }, [typeId]);

  return { items, loading, error, reload };
}

export function useVehicleManufacturers(categoryId: number | null) {
  const load = useCallback(
    ({ q, page }: { q: string; page: number }) =>
      api.vehicleManufacturers({ categoryId, q, page, pageSize: 100 }),
    [categoryId],
  );
  return useMasterList<VehicleManufacturer>(
    categoryId == null ? null : `mfr:${categoryId}`,
    load,
    categoryId != null,
  );
}

export function useVehicleModels(manufacturerId: number | null, categoryId: number | null) {
  const enabled = manufacturerId != null && !isOther(manufacturerId) && categoryId != null;
  const load = useCallback(
    ({ q, page }: { q: string; page: number }) =>
      api.vehicleModels({ manufacturerId, categoryId, q, page, pageSize: 100 }),
    [manufacturerId, categoryId],
  );
  return useMasterList<VehicleModel>(enabled ? `models:${manufacturerId}:${categoryId}` : null, load, enabled);
}

export function useVehicleVariants(modelId: number | null) {
  const enabled = modelId != null && !isOther(modelId);
  const load = useCallback(() => api.vehicleVariants(modelId), [modelId]);
  return useMasterList<VehicleVariant>(enabled ? `variants:${modelId}` : null, load, enabled);
}

export function useVehicleFuelTypes(
  modelId: number | null,
  categoryId: number | null,
  fallback: VehicleFuelType[],
) {
  const [items, setItems] = useState<VehicleFuelType[]>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryId == null) {
      setItems(fallback);
      return;
    }
    let alive = true;
    const key = `fuel:${modelId ?? 'x'}:${categoryId}`;
    setLoading(true);
    setError(null);
    cached(key, () => api.vehicleFuelTypes({ modelId, categoryId }))
      .then((rows) => alive && setItems(rows))
      .catch((err) => {
        if (!alive) return;
        // The full list is a safe fallback — never leave the user with nothing.
        setError(message(err, 'Could not load power types'));
        setItems(fallback);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [modelId, categoryId, fallback]);

  return { items, loading, error };
}

/* ── Option adapters ──────────────────────────── */

export interface MasterOption {
  value: number;
  label: string;
  icon?: string;
  hint?: string;
}

/** Master rows → <Select /> options. Icons come from the data, not from here. */
export function toOptions(
  rows: Array<{ id: number; name: string; icon?: string | null; description?: string | null }>,
  opts: { withHint?: boolean } = {},
): MasterOption[] {
  return rows.map((r) => ({
    value: r.id,
    label: r.name,
    icon: r.icon ?? undefined,
    hint: opts.withHint && r.description ? r.description : undefined,
  }));
}

/** Grouped category options: a heading per vehicle type, then its categories. */
export function useGroupedCategories(types: VehicleType[], categories: VehicleCategory[]) {
  return useMemo(() => {
    const byType = new Map<number, VehicleCategory[]>();
    for (const c of categories) {
      const list = byType.get(c.vehicleTypeId) ?? [];
      list.push(c);
      byType.set(c.vehicleTypeId, list);
    }
    return types
      .map((t) => ({ type: t, categories: byType.get(t.id) ?? [] }))
      .filter((g) => g.categories.length > 0);
  }, [types, categories]);
}
