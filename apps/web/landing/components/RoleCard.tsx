'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — RoleCard

   One card per user segment, painted in that segment's accent: an icon
   medallion and a figure across the top, the pitch below, and a full-width
   call to action on the floor of the card. Hover lifts the card; pressing
   fires a ripple in the accent.

   Only `transform` and `opacity` animate, so the whole grid stays on the
   compositor.

   The whole card is one button — the CTA is a <span>, not a nested control.
   Copy and accent come from lib/roles.ts; the route and id still come from
   @automate/shared-brand, which the mobile RoleCard shares.
   ────────────────────────────────────────────── */

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { RoleDefinition } from '@automate/shared-brand';
import { RoleIcon } from './RoleIcon';
import { RoleArt } from './RoleArt';
import { BrandLoader } from './BrandLoader';
import { presentationFor } from '@/lib/roles';
import { staggerItem, transition, usePrefersReducedMotion } from '@/lib/motion';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function RoleCard({
  role,
  onSelect,
  onWarm,
  pending = false,
  disabled = false,
}: {
  role: RoleDefinition;
  onSelect: (role: RoleDefinition) => void;
  /** Hover/focus hint: prefetch the handoff route and warm the role origin. */
  onWarm?: (role: RoleDefinition) => void;
  /** This card started the hand-off — swap the CTA for the activity mark. */
  pending?: boolean;
  /** Some card is resolving; every card locks until it settles. */
  disabled?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);
  const look = presentationFor(role);

  const spawnRipple = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const id = rippleId.current++;
    setRipples((prev) => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    // Drop the node once its 600ms animation has played out.
    window.setTimeout(() => setRipples((prev) => prev.filter((rp) => rp.id !== id)), 620);
  }, []);

  return (
    <motion.button
      ref={ref}
      type="button"
      variants={staggerItem}
      onPointerDown={disabled ? undefined : spawnRipple}
      onPointerEnter={() => onWarm?.(role)}
      onFocus={() => onWarm?.(role)}
      onClick={() => onSelect(role)}
      disabled={disabled}
      aria-busy={pending}
      whileHover={reduced || disabled ? undefined : { y: -8 }}
      whileTap={reduced || disabled ? undefined : { scale: 0.99 }}
      transition={transition.snappy}
      aria-label={look.cta}
      style={{ backgroundImage: look.surface, borderColor: look.border }}
      className={[
        'group relative isolate flex w-full flex-col overflow-hidden rounded-3xl border p-6 text-left shadow-plate transition-shadow duration-300 hover:shadow-lift sm:p-7',
        // Dim the cards that weren't chosen; the pending one stays fully lit so
        // it reads as the thing that is happening.
        disabled && !pending ? 'pointer-events-none opacity-45' : '',
        pending ? 'cursor-progress' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Accent bloom in the upper-left, so the card lights from its icon. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 -z-10 h-56 w-56 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: look.accent }}
      />

      {/* ── Icon + figure ── */}
      <div className="flex items-start justify-between gap-4">
        <span
          className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105"
          style={{ background: look.accent, color: look.onAccent }}
        >
          <RoleIcon role={role.id} className="h-7 w-7" />
        </span>

        <RoleArt
          role={role.id}
          className="h-[4.75rem] w-auto max-w-[58%] shrink opacity-70 transition-opacity duration-300 group-hover:opacity-90"
        />
      </div>

      {/* Press ripples */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          aria-hidden
          className="pointer-events-none absolute -z-10 rounded-full"
          style={{
            left: r.x,
            top: r.y,
            width: 24,
            height: 24,
            marginLeft: -12,
            marginTop: -12,
            background: `${look.accent}44`,
          }}
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 24, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}

      {/* ── Copy ── */}
      <h3 className="mt-5 font-display text-[1.4rem] font-bold text-bone sm:text-2xl">
        {look.label}
      </h3>
      <p className="mt-2.5 text-sm leading-relaxed text-bone/65">{look.description}</p>

      {/* ── CTA — a span, because the whole card is the button. While the
          hand-off runs, the arrow is replaced by the activity mark, so the
          feedback lands on the control that was clicked as well as behind
          the overlay. ── */}
      <span
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold transition-colors duration-300"
        style={{ background: look.accent, color: look.onAccent }}
      >
        {pending ? 'Opening…' : look.cta}
        {pending ? (
          <BrandLoader size={18} monochrome className="shrink-0" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1.5"
            aria-hidden="true"
          >
            <path
              d="M5 12h13m0 0-5-5m5 5-5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </motion.button>
  );
}
