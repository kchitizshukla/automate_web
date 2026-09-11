'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — RoleCard

   One card per user segment. A photograph fills the upper
   third under a scrim; the copy sits on a graphite panel
   below. Hover lifts the card and slowly zooms the photo;
   pressing fires a ripple in the role's accent.

   Only `transform` and `opacity` animate, so the whole
   grid stays on the compositor.

   The mobile twin lives in each app's
   mobile/src/components/RoleCard.tsx and shares this
   card's copy, accents and photography via
   @automate/shared-brand.
   ────────────────────────────────────────────── */

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { RoleDefinition } from '@automate/shared-brand';
import { RoleIcon } from './RoleIcon';
import { BrandLoader } from './BrandLoader';
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
      aria-label={role.cta}
      className={[
        'group relative isolate flex w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-graphite-ink text-left shadow-plate transition-colors duration-300 hover:border-white/25 hover:shadow-lift',
        // Dim the cards that weren't chosen; the pending one stays fully lit so
        // it reads as the thing that is happening.
        disabled && !pending ? 'pointer-events-none opacity-45' : '',
        pending ? 'cursor-progress' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* ── Photograph ── */}
      <div className="relative h-44 overflow-hidden sm:h-48">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
          style={{ backgroundImage: `url('${role.image}')` }}
        />
        <div className="scrim-card absolute inset-0" />

        {/* Icon medallion, straddling the photo/panel seam */}
        <span
          className="absolute bottom-0 left-6 flex h-14 w-14 translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-graphite-raised transition-transform duration-300 group-hover:scale-105"
          style={{ color: role.accent }}
        >
          <RoleIcon role={role.id} className="h-8 w-8" />
        </span>
      </div>

      {/* Accent rule marking the seam */}
      <span
        aria-hidden
        className="h-px w-full origin-left scale-x-[0.28] transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${role.accent}, transparent)` }}
      />

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
            background: `${role.accent}44`,
          }}
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 24, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}

      {/* ── Copy panel ── */}
      <div className="flex flex-1 flex-col px-6 pb-6 pt-11 sm:px-7">
        <h3 className="font-display text-xl font-bold text-bone sm:text-2xl">{role.label}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/55">{role.description}</p>

        <ul className="mt-5 space-y-2.5">
          {role.highlights.map((h) => (
            <li key={h} className="flex items-center gap-2.5 text-[13px] text-white/75">
              <span
                aria-hidden
                className="h-px w-4 shrink-0"
                style={{ background: role.accent }}
              />
              {h}
            </li>
          ))}
        </ul>

        {/* CTA — a span, because the whole card is the button. While the
            hand-off runs, the arrow is replaced by the activity mark in this
            role's accent, so the feedback lands on the control that was
            clicked as well as behind the overlay. */}
        <span
          className="mt-auto flex items-center justify-between gap-3 pt-7 text-sm font-bold transition-colors duration-300"
          style={{ color: role.accent }}
        >
          {pending ? 'Opening…' : role.cta}
          {pending ? (
            <BrandLoader size={20} accent={role.accent} className="shrink-0" />
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
      </div>
    </motion.button>
  );
}
