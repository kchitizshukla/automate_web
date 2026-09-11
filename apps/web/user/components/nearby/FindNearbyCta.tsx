'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '@/lib/motion';

/**
 * The primary action on the Find Mechanics screen. Deliberately the only
 * high-emphasis CTA there — the saved-mechanic list below stays quiet.
 */
export function FindNearbyCta({
  onClick,
  busy,
  disabled,
  hint,
}: {
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
  hint?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="mb-6"
    >
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled || busy}
        whileHover={reduce || disabled ? undefined : { scale: 1.01, y: -2 }}
        whileTap={reduce || disabled ? undefined : { scale: 0.99 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="group relative block w-full overflow-hidden rounded-3xl text-left shadow-soft transition disabled:cursor-not-allowed disabled:opacity-70"
      >
        {/* Layered gradient + road-marking motif, no external image needed. */}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500" />
        <span
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, rgba(255,255,255,0.18) 0 14px, rgba(255,255,255,0) 14px 42px)',
          }}
        />
        {!reduce && (
          <motion.span
            aria-hidden
            className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl"
            animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.12, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <span className="relative flex flex-col gap-4 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <span className="flex items-center gap-4">
            <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
              🛠️
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-2xl border-2 border-white/50"
                  animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xl font-extrabold leading-tight sm:text-2xl">
                  Find Mechanics Nearby
                </span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide backdrop-blur">
                  Roadside SOS
                </span>
              </span>
              <span className="mt-1 block text-sm text-indigo-50/90">
                {hint ?? 'Broken down? Get a verified mechanic to your location with a live ETA.'}
              </span>
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-indigo-700 shadow-lg transition group-hover:bg-indigo-50">
            <span aria-hidden>📍</span>
            {busy ? 'Opening…' : 'Get help now'}
            <motion.span
              aria-hidden
              animate={reduce ? undefined : { x: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              →
            </motion.span>
          </span>
        </span>
      </motion.button>
    </motion.div>
  );
}
