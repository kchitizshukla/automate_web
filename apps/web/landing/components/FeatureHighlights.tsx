'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — feature strip

   Reveals on scroll (`whileInView`, once) so nothing
   animates until it is actually on screen.
   ────────────────────────────────────────────── */

import { motion } from 'framer-motion';
import { FEATURES, IMAGES } from '@automate/shared-brand';
import { Backdrop } from './Backdrop';
import { staggerContainer, staggerItem } from '@/lib/motion';

/* Ionicons names in the shared package map to these inline paths on web,
   so the two platforms stay visually consistent without a font download. */
const GLYPHS: Record<string, string> = {
  flash: 'M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z',
  ribbon: 'M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm-3.4 11.4L6 22l6-2.6L18 22l-2.6-7.6',
  pulse: 'M2 12h4l3-8 4 16 3-8h6',
  'stats-chart': 'M5 21V10m7 11V4m7 17v-7',
};

export function FeatureHighlights() {
  return (
    <section id="features" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28">
      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto w-full max-w-6xl"
      >
        <motion.p
          variants={staggerItem}
          className="text-center text-[11px] font-semibold uppercase tracking-widest text-amber"
        >
          What you get
        </motion.p>
        <motion.h2
          variants={staggerItem}
          className="mt-4 text-center font-display text-3xl font-bold text-bone sm:text-4xl"
        >
          Built for the whole <span className="text-brand-gradient">service journey</span>
        </motion.h2>
        <motion.p
          variants={staggerItem}
          className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/55 sm:text-base"
        >
          From the moment a warning light comes on to the payout hitting a mechanic&apos;s account —
          one platform, three connected experiences.
        </motion.p>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <motion.article
              key={f.title}
              variants={staggerItem}
              className="group bg-graphite-ink p-6 transition-colors duration-300 hover:bg-graphite-surface"
            >
              <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber/30 bg-amber/10 text-amber transition-colors duration-300 group-hover:bg-amber/20">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path
                    d={GLYPHS[f.icon]}
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h3 className="font-display text-base font-semibold text-bone">{f.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">{f.body}</p>
            </motion.article>
          ))}
        </div>

        {/* Two photographic showcase panels */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ShowcasePanel
            image={IMAGES.engine}
            eyebrow="For mechanics"
            title="Jobs that come to you"
            body="Accept nearby requests, publish your service catalogue and track earnings — all from the bay."
          />
          <ShowcasePanel
            image={IMAGES.admin}
            eyebrow="For admins"
            title="The whole platform, one console"
            body="Approve workshops, assign jobs, reconcile payments and read live health metrics at a glance."
          />
        </div>
      </motion.div>
    </section>
  );
}

function ShowcasePanel({
  image,
  eyebrow,
  title,
  body,
}: {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -5 }}
      className="group relative isolate min-h-[19rem] overflow-hidden rounded-3xl border border-white/10 shadow-plate"
    >
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
        style={{ backgroundImage: `url('${image}')`, opacity: 0.7 }}
      />
      <div className="scrim-card absolute inset-0 -z-10" />

      <div className="flex h-full flex-col justify-end p-7 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber">{eyebrow}</p>
        <h3 className="mt-2 font-display text-xl font-bold text-bone sm:text-2xl">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">{body}</p>
      </div>
    </motion.div>
  );
}
