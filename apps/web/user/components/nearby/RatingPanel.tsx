'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { NearbyRequest } from '@automate/shared-types';
import { classNames } from '@automate/shared-utils';
import { api } from '@/lib/api';
import { EASE } from '@/lib/motion';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

/**
 * Rating lives inside the same job card — the customer never has to go
 * hunting for the mechanic's profile to leave a review.
 */
export function RatingPanel({
  request,
  onUpdated,
}: {
  request: NearbyRequest;
  onUpdated: (r: NearbyRequest) => void;
}) {
  const reduce = useReducedMotion();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mechanicName = request.mechanic?.name ?? 'your mechanic';
  const submitted = request.rating ?? null;

  async function submit() {
    if (!stars || submitting) return; // guards a double tap as well as a bad value
    setSubmitting(true);
    setError(null);
    try {
      onUpdated(await api.rateNearbyJob(request.id, stars, review.trim() || null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your rating');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Already rated: confirmation ───────────── */
  if (submitted) {
    return (
      <motion.section
        initial={reduce ? false : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-sky-50 p-5 text-center"
      >
        <div className="flex justify-center gap-1" aria-label={`${submitted.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.span
              key={n}
              aria-hidden
              className={classNames('text-2xl', n <= submitted.rating ? 'text-amber-400' : 'text-slate-300')}
              initial={reduce ? false : { scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: reduce ? 0 : n * 0.06, duration: 0.3, ease: EASE }}
            >
              ★
            </motion.span>
          ))}
        </div>
        <p className="mt-2 font-display text-lg font-bold text-slate-900">
          Thanks for rating {mechanicName}!
        </p>
        <p className="mt-0.5 text-sm text-slate-600">
          Your {submitted.rating}-star rating has been submitted.
        </p>
        {submitted.review && (
          <p className="mx-auto mt-3 max-w-md rounded-xl bg-white/70 px-3 py-2 text-sm italic text-slate-600">
            “{submitted.review}”
          </p>
        )}
      </motion.section>
    );
  }

  /* ── Collect a rating ──────────────────────── */
  const shown = hover || stars;

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="rounded-2xl border border-slate-200 p-4"
    >
      <h3 className="font-display font-bold text-slate-900">Rate your mechanic</h3>
      <p className="text-sm text-slate-500">
        How was your experience with <span className="font-medium text-slate-700">{mechanicName}</span>?
      </p>

      <div className="mt-3 flex flex-col items-center gap-1">
        <div className="flex gap-1" role="radiogroup" aria-label="Rating out of 5 stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setStars(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              // Generous hit area for thumbs, without a giant visual star.
              className="grid h-12 w-12 place-items-center rounded-xl transition hover:bg-amber-50"
              whileTap={reduce ? undefined : { scale: 0.85 }}
              animate={reduce ? undefined : { scale: n <= shown ? 1.12 : 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            >
              <span
                aria-hidden
                className={classNames(
                  'text-3xl transition-colors',
                  n <= shown ? 'text-amber-400' : 'text-slate-300',
                )}
              >
                ★
              </span>
            </motion.button>
          ))}
        </div>
        <AnimatePresence mode="popLayout">
          <motion.p
            key={shown}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="h-5 text-sm font-semibold text-amber-600"
          >
            {LABELS[shown] ?? ''}
          </motion.p>
        </AnimatePresence>
      </div>

      <label className="mt-2 block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          Tell us about your experience <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <textarea
          rows={3}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this mechanic..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
        />
      </label>

      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={!stars || submitting}
        className="mt-3 w-full rounded-2xl bg-aurora px-4 py-3.5 font-semibold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : stars ? 'Submit Rating' : 'Select a rating to continue'}
      </button>
    </motion.section>
  );
}
