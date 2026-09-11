'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { apiActivity } from '@/lib/api';
import { BrandLoader, BrandLoaderBar } from '@/components/BrandLoader';

/**
 * App-wide activity indicator. It is the only thing in the product that
 * decides when the user is shown "something is happening", and it watches
 * both sources of waiting:
 *
 *   • API traffic — the shared ApiClient's in-flight counter, so no screen
 *     raises or lowers it by hand, and
 *   • route changes — the App Router gives no navigation events, so a click
 *     on an internal link starts the indicator and the new pathname stops it.
 *
 * Two layers, so short waits never flash a modal in the user's face:
 * a top bar for everything, escalating to a blocking card past 450ms.
 */
export function GlobalLoader() {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const [apiBusy, setApiBusy] = useState(false);
  const [navBusy, setNavBusy] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => apiActivity.subscribe((next) => setApiBusy(next)), []);

  // ── Route changes ──
  // Capture-phase so we still see the click when a component stops propagation.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.('a');
      const href = anchor?.getAttribute('href');
      if (!anchor || !href) return;
      // Only same-tab, same-origin navigations to a different page.
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      if (/^(https?:)?\/\//i.test(href) && !href.startsWith(window.location.origin)) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const dest = new URL(anchor.href, window.location.href);
      if (dest.pathname === window.location.pathname) return;
      setNavBusy(true);
    }
    // Back/forward also swap the page.
    const onPop = () => setNavBusy(true);
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPop);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  // The new pathname rendering is the navigation finishing.
  useEffect(() => setNavBusy(false), [pathname]);

  // A blocked or cancelled navigation must never strand the indicator.
  useEffect(() => {
    if (!navBusy) return;
    const timer = setTimeout(() => setNavBusy(false), 8000);
    return () => clearTimeout(timer);
  }, [navBusy]);

  const active = apiBusy || navBusy;

  // Only escalate to the blocking overlay if the work is actually slow.
  useEffect(() => {
    if (!active) {
      setBlocking(false);
      return;
    }
    const timer = setTimeout(() => setBlocking(true), 450);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div key="bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BrandLoaderBar />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {blocking && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[9997] grid place-items-center bg-slate-950/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="status"
            aria-live="polite"
            aria-label={navBusy ? 'Loading page' : 'Working'}
          >
            <motion.div
              className="flex flex-col items-center gap-4 rounded-3xl bg-white/95 px-9 py-8 shadow-2xl"
              initial={reduce ? false : { scale: 0.94, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <BrandLoader size={56} />
              <p className="text-sm font-semibold text-slate-700">
                {navBusy ? 'Loading…' : 'Working…'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
