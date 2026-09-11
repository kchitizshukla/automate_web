'use client';

import { useCallback, useEffect, useState } from 'react';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Generic fetch hook with reload support. */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const reload = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (active)
          setState({
            data: null,
            loading: false,
            error: e instanceof Error ? e.message : 'Something went wrong',
          });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const cleanup = reload();
    return cleanup;
  }, [reload]);

  return { ...state, reload };
}
