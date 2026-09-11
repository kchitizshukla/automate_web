'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — hero

   Full-bleed showroom photograph under a graphite scrim,
   with the headline, tagline and stats set over it.
   Collapses to a single centred column below `lg`.
   ────────────────────────────────────────────── */

import { motion } from 'framer-motion';
import { IMAGES, STATS, SUBTEXT, TAGLINE } from '@automate/shared-brand';
import { Backdrop } from './Backdrop';
import { scaleIn, staggerContainer, staggerItem, transition } from '@/lib/motion';

export function HeroSection({ onExplore }: { onExplore: () => void }) {
  return (
    <section className="relative isolate overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
      <Backdrop src={IMAGES.hero} opacity={0.45} animated className="-z-10" />

      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        animate="show"
        className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12"
      >
        {/* ── Copy column ── */}
        <div className="text-center lg:text-left">
          <motion.div variants={staggerItem} className="flex justify-center lg:justify-start">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-black/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-amber-soft backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              Trusted service network
            </span>
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="mt-7 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl"
          >
            <span className="text-bone">Every vehicle deserves</span>{' '}
            <span className="text-brand-gradient">expert care.</span>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mx-auto mt-6 max-w-xl text-base font-medium text-bone/85 sm:text-lg lg:mx-0"
          >
            {TAGLINE}
          </motion.p>
          <motion.p
            variants={staggerItem}
            className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base lg:mx-0"
          >
            {SUBTEXT}
          </motion.p>

          <motion.div
            variants={staggerItem}
            className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
          >
            <motion.button
              type="button"
              onClick={onExplore}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={transition.snappy}
              className="rounded-xl bg-amber px-7 py-3.5 text-sm font-bold text-graphite shadow-plate transition-colors hover:bg-amber-soft"
            >
              Choose your role
            </motion.button>
            <a
              href="#features"
              className="rounded-xl border border-white/18 bg-white/[0.04] px-7 py-3.5 text-center text-sm font-semibold text-bone backdrop-blur-md transition-colors hover:border-amber/50 hover:bg-white/[0.08]"
            >
              How it works
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.dl
            variants={staggerItem}
            className="mt-12 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 max-lg:mx-auto"
          >
            {STATS.map((s) => (
              <div key={s.label} className="bg-graphite-ink/85 px-4 py-5 text-center lg:text-left">
                <dt className="font-display text-2xl font-bold text-amber">{s.value}</dt>
                <dd className="mt-1 text-[11px] leading-tight text-white/50">{s.label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* ── Inset photograph ── */}
        <motion.div variants={scaleIn} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/12 shadow-lift">
            <Backdrop src={IMAGES.workshop} variant="scrim-card" opacity={0.85} />
            <div className="relative flex h-full flex-col justify-end p-7">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber">
                In the workshop
              </p>
              <p className="mt-2 font-display text-xl font-bold leading-snug text-bone">
                Certified workshops, transparent pricing, real-time updates.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
