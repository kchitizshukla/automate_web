'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — hero

   Two columns over a full-bleed workshop photograph: the promise on the left,
   the coverage grid on the right. The scrim is weighted towards the left edge
   (see `.scrim` in globals.css) so the headline sits on near-solid navy while
   the mechanic still reads through on the right.

   Collapses to a single centred column below `lg`.
   ────────────────────────────────────────────── */

import { motion } from 'framer-motion';
import { IMAGES, SUBTEXT } from '@automate/shared-brand';
import { Backdrop } from './Backdrop';
import { VehicleGrid } from './VehicleGrid';
import { staggerContainer, staggerItem, transition } from '@/lib/motion';

export function HeroSection({ onExplore }: { onExplore: () => void }) {
  return (
    <section
      id="top"
      className="relative isolate scroll-mt-20 overflow-hidden px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-16"
    >
      <Backdrop src={IMAGES.mechanic} opacity={0.72} position="right" animated className="-z-10" />

      <motion.div
        variants={staggerContainer(0.09)}
        initial="hidden"
        animate="show"
        className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12"
      >
        {/* ── Copy column ── */}
        <div className="text-center lg:text-left">
          <motion.div variants={staggerItem} className="flex justify-center lg:justify-start">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-bone/90 backdrop-blur-md">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-azure" aria-hidden="true">
                <path
                  d="M12 3 4.5 6v6c0 4.6 3.1 8.4 7.5 9.7 4.4-1.3 7.5-5.1 7.5-9.7V6L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="m9 12 2.2 2.2L15.4 10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              All Vehicles
              <span aria-hidden className="h-1 w-1 rounded-full bg-white/35" />
              One Platform
            </span>
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="mt-7 font-display text-[2.05rem] font-extrabold leading-[1.08] sm:text-[2.6rem] lg:text-[2.7rem] xl:text-[3rem]"
          >
            <span className="text-bone">Complete Vehicle Care,</span>
            <br />
            <span className="text-azure-glow">Anywhere, Anytime.</span>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-mist sm:text-base lg:mx-0"
          >
            AutoMate connects vehicle owners with trusted mechanics, offers reliable service, and
            keeps your vehicle running at its best — no matter what you drive.
          </motion.p>
          {/* The shared one-liner, kept for search engines and screen readers
              without competing with the headline for attention. */}
          <span className="sr-only">{SUBTEXT}</span>

          <motion.div
            variants={staggerItem}
            className="mt-9 flex justify-center lg:justify-start"
          >
            <motion.button
              type="button"
              onClick={onExplore}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={transition.snappy}
              className="group inline-flex items-center gap-3 rounded-full bg-azure px-8 py-3.5 text-[15px] font-bold text-white shadow-azure transition-colors hover:bg-azure-soft"
            >
              Get Started
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1"
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
            </motion.button>
          </motion.div>
        </div>

        {/* ── Coverage grid ── */}
        <motion.div variants={staggerItem} className="mx-auto w-full max-w-xl lg:max-w-none">
          <VehicleGrid />
        </motion.div>
      </motion.div>
    </section>
  );
}
