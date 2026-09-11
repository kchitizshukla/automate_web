'use client';

/* ──────────────────────────────────────────────
   AutoMate — centralized animation config
   One source of truth for easings, durations and
   reusable Framer Motion variants. Keep animations
   short (≤300ms for interactions) and honour the
   user's reduced-motion preference everywhere.
   ────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import type { Transition, Variants } from 'framer-motion';

/** Signature Aurora easing — matches the CSS `rise` keyframe. */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Durations (seconds). Interactions stay ≤0.3s per the perf rules. */
export const DUR = {
  fast: 0.16,
  base: 0.24,
  slow: 0.42,
} as const;

export const transition = {
  base: { duration: DUR.base, ease: EASE } as Transition,
  slow: { duration: DUR.slow, ease: EASE } as Transition,
  snappy: { type: 'spring', stiffness: 400, damping: 32 } as Transition,
  soft: { type: 'spring', stiffness: 260, damping: 26 } as Transition,
};

/* ── Reusable variants ──────────────────────── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: DUR.base, ease: EASE_OUT } },
};

/** Container that staggers its `staggerItem` children. */
export const staggerContainer = (gap = 0.06): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap } },
});

export const staggerItem: Variants = fadeUp;

/** Route page-transition (fade + slide). */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: DUR.fast, ease: EASE } },
};

/** Micro-interaction presets for buttons / cards. */
export const tap = { scale: 0.97 };
export const hoverLift = { y: -4, transition: transition.snappy };
export const hoverScale = { scale: 1.05, transition: transition.snappy };

/* ── Reduced-motion (SSR-safe) ──────────────── */
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

/* ── Time-aware greeting (relatable feature) ─── */
export function greetingFor(date = new Date()): { text: string; emoji: string } {
  const h = date.getHours();
  if (h < 5) return { text: 'Still up', emoji: '🌙' };
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  if (h < 21) return { text: 'Good evening', emoji: '🌆' };
  return { text: 'Good night', emoji: '🌙' };
}
