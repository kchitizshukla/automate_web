'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — global loading overlay

   The landing app's waits are all navigations, and they are the slow kind:
   picking a role routes to `/<role>/auth`, and signing in leaves this origin
   entirely for the role app's login. Neither gives any feedback of its own
   until the next document paints, which is exactly the gap that made the
   buttons feel dead.

   So the overlay is raised explicitly by whoever starts the navigation
   (`useLoader().show()`), rather than inferred. Two rules keep it honest:

     • it mounts instantly — no 450ms grace period, because the whole point is
       feedback on the click itself, and
     • a hard safety timeout always lowers it, so a blocked, cancelled or
       failed navigation can never strand the visitor behind a curtain.
   ────────────────────────────────────────────── */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { BrandLoader, BrandLoaderBar } from './BrandLoader';
import { Brandmark } from './Brandmark';
import { usePrefersReducedMotion } from '@/lib/motion';

/** Nothing may hold the overlay longer than this, whatever goes wrong. */
const SAFETY_MS = 12_000;

interface LoaderState {
  visible: boolean;
  message: string;
  /** Second line — where we're going, so the wait is legible. */
  detail?: string;
  /** Role accent, so the mark matches the card that was clicked. */
  accent?: string;
}

interface LoaderContextValue extends LoaderState {
  show: (opts?: { message?: string; detail?: string; accent?: string }) => void;
  hide: () => void;
}

const LoaderContext = createContext<LoaderContextValue>({
  visible: false,
  message: 'Loading…',
  show: () => undefined,
  hide: () => undefined,
});

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LoaderState>({ visible: false, message: 'Loading…' });
  const timer = useRef<number | undefined>(undefined);

  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, []);

  const show = useCallback<LoaderContextValue['show']>((opts) => {
    window.clearTimeout(timer.current);
    setState({
      visible: true,
      message: opts?.message ?? 'Loading…',
      detail: opts?.detail,
      accent: opts?.accent,
    });
    timer.current = window.setTimeout(
      () => setState((prev) => ({ ...prev, visible: false })),
      SAFETY_MS,
    );
  }, []);

  // Never leave a timer running past unmount.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const value = useMemo<LoaderContextValue>(
    () => ({ ...state, show, hide }),
    [state, show, hide],
  );

  return (
    <LoaderContext.Provider value={value}>
      {children}
      <GlobalLoader />
    </LoaderContext.Provider>
  );
}

export function useLoader(): LoaderContextValue {
  return useContext(LoaderContext);
}

/**
 * The overlay itself. Rendered once by the provider — screens raise it through
 * `useLoader()` rather than mounting their own.
 */
export function GlobalLoader() {
  const { visible, message, detail, accent, hide } = useLoader();
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();
  const firstPath = useRef(pathname);

  // Arriving on a new route means the navigation we were covering is done.
  // The destination page can still re-raise the overlay for its own work.
  useEffect(() => {
    if (pathname !== firstPath.current) hide();
    firstPath.current = pathname;
  }, [pathname, hide]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          <BrandLoaderBar accent={accent} />
          <motion.div
            key="overlay"
            /* Above the sticky nav (z-50) and anything else on the page, but
               below the top bar so the two never fight. */
            className="fixed inset-0 z-[9998] grid place-items-center bg-graphite/80 px-5 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            role="alertdialog"
            aria-modal="true"
            aria-busy="true"
            aria-live="assertive"
            aria-label={message}
            /* Swallow clicks and keystrokes so a second Sign In press can't
               land on the button underneath. */
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="panel flex w-full max-w-xs flex-col items-center gap-5 rounded-3xl px-8 py-9 text-center"
              initial={reduced ? false : { scale: 0.94, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Brandmark />
              <BrandLoader size={64} accent={accent} />
              <div>
                <p className="font-display text-base font-bold text-bone">{message}</p>
                {detail && <p className="mt-1.5 text-xs text-white/55">{detail}</p>}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
