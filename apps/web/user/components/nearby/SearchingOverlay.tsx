'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASE } from '@/lib/motion';

/** Reassuring copy that advances while the radar sweeps. */
const PHASES = [
  { at: 0, title: 'Finding a nearby mechanic…', sub: 'Scanning verified workshops around your location' },
  { at: 4, title: 'Checking availability…', sub: 'Matching your issue to the right specialist' },
  { at: 8, title: 'Connecting you with a mechanic…', sub: 'Sending your request and waiting for a response' },
];

export function SearchingOverlay({
  open,
  onCancel,
  cancelling,
  issueLabel,
  locationLabel,
}: {
  open: boolean;
  onCancel: () => void;
  cancelling?: boolean;
  issueLabel?: string;
  locationLabel?: string;
}) {
  const reduce = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [open]);

  const phase = [...PHASES].reverse().find((p) => elapsed >= p.at) ?? PHASES[0];

  // Portalled to <body>: the Shell animates page content with a transform, and
  // a transformed ancestor becomes the containing block for position: fixed,
  // which would scope this full-screen overlay to the page box.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Searching for a mechanic"
        >
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 p-6 text-center text-white shadow-2xl sm:p-8"
          >
            {/* Map-ish grid behind the radar */}
            <span
              aria-hidden
              className="absolute inset-0 opacity-[0.13]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '34px 34px',
              }}
            />

            <div className="relative mx-auto grid h-52 w-52 place-items-center sm:h-60 sm:w-60">
              {/* Expanding radar rings */}
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute rounded-full border border-indigo-400/60"
                  style={{ height: '100%', width: '100%' }}
                  initial={{ scale: 0.3, opacity: 0.7 }}
                  animate={reduce ? { scale: 0.9, opacity: 0.35 } : { scale: [0.3, 1], opacity: [0.7, 0] }}
                  transition={
                    reduce
                      ? { duration: 0.4 }
                      : { duration: 3, repeat: Infinity, delay: i * 1, ease: 'easeOut' }
                  }
                />
              ))}

              {/* Sweeping beam */}
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute h-full w-full rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, rgba(99,102,241,0) 0deg, rgba(99,102,241,0.45) 55deg, rgba(99,102,241,0) 90deg)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
                />
              )}

              <span aria-hidden className="absolute h-1/2 w-1/2 rounded-full border border-indigo-400/30" />

              {/* Candidate workshops blinking in and out */}
              {!reduce &&
                [
                  { top: '18%', left: '24%', d: 0.4 },
                  { top: '30%', left: '76%', d: 1.2 },
                  { top: '72%', left: '30%', d: 2.0 },
                  { top: '66%', left: '70%', d: 2.6 },
                ].map((p) => (
                  <motion.span
                    key={`${p.top}-${p.left}`}
                    aria-hidden
                    className="absolute text-sm"
                    style={{ top: p.top, left: p.left }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.7] }}
                    transition={{ duration: 3.2, repeat: Infinity, delay: p.d, ease: 'easeInOut' }}
                  >
                    🔧
                  </motion.span>
                ))}

              {/* You */}
              <span className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-indigo-500 text-2xl shadow-glow">
                📍
                {!reduce && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-indigo-400"
                    animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={phase.title}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="relative mt-5"
              >
                <h2 className="font-display text-xl font-bold sm:text-2xl">{phase.title}</h2>
                <p className="mt-1.5 text-sm text-slate-300">{phase.sub}</p>
              </motion.div>
            </AnimatePresence>

            <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              {issueLabel && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">🔧 {issueLabel}</span>
              )}
              {locationLabel && (
                <span className="max-w-full truncate rounded-full bg-white/10 px-3 py-1 text-slate-200">
                  📍 {locationLabel}
                </span>
              )}
              <span className="rounded-full bg-white/10 px-3 py-1 tabular-nums text-slate-200">
                ⏱ {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
              </span>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className="relative mt-6 w-full rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
            >
              {cancelling ? 'Cancelling…' : 'Cancel request'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
