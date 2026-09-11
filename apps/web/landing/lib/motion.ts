'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — animation config

   Mirrors lib/motion.ts in the role apps: one source
   of truth for easings, durations and variants. Keep
   interactions ≤300ms and always honour reduced motion.
   ────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import type { Transition, Variants } from 'framer-motion';
import { motion as MOTION } from '@automate/shared-brand';

export const EASE = MOTION.ease;

/** Durations in seconds (the shared package stores milliseconds). */
export const DUR = {
  fast: MOTION.fast / 1000,
  base: MOTION.base / 1000,
  slow: MOTION.slow / 1000,
} as const;

export const transition = {
  base: { duration: DUR.base, ease: EASE } as Transition,
  slow: { duration: DUR.slow, ease: EASE } as Transition,
  snappy: { type: 'spring', stiffness: 400, damping: 32 } as Transition,
  soft: { type: 'spring', stiffness: 260, damping: 26 } as Transition,
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: DUR.base, ease: EASE } },
};

export const staggerContainer = (gap = 0.09, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

export const staggerItem: Variants = fadeUp;

export const tap = { scale: 0.97 };

/* ── Reduced motion (SSR-safe) ──────────────── */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}
