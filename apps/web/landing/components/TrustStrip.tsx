'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — trust strip

   The four reassurances that sit under the role cards: the objections a
   first-time visitor raises between choosing a lane and signing in. One row
   with hairline dividers on desktop, a 2×2 grid on mobile where the dividers
   would only add noise.
   ────────────────────────────────────────────── */

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';

interface Assurance {
  title: string;
  body: string;
  /** Inline path data, drawn on a 24×24 viewBox. */
  path: string;
}

const ASSURANCES: Assurance[] = [
  {
    title: 'Trusted Mechanics',
    body: 'Verified & Background Checked',
    path: 'M12 3 4.5 6v6c0 4.6 3.1 8.4 7.5 9.7 4.4-1.3 7.5-5.1 7.5-9.7V6L12 3Zm-3 9 2.2 2.2L15.4 10',
  },
  {
    title: 'Quick & Easy Booking',
    body: 'Save time, get back on the road',
    path: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4.2V12l3.4 2',
  },
  {
    title: 'Transparent Pricing',
    body: 'No hidden charges',
    path: 'm12 3.5 2.7 5.5 6 .9-4.35 4.25L17.4 20 12 17.15 6.6 20l1.05-5.85L3.3 9.9l6-.9L12 3.5Z',
  },
  {
    title: '24/7 Support',
    body: "We're always here to help",
    path: 'M4 14v-2a8 8 0 0 1 16 0v2m-16 0v2.5a2 2 0 0 0 2 2h1.5V14H4Zm16 0v2.5a2.5 2.5 0 0 1-2.5 2.5H13m5-5h-3.5v4.5H18',
  },
];

export function TrustStrip() {
  return (
    <motion.ul
      variants={staggerContainer(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      className="mx-auto mt-14 grid w-full max-w-6xl grid-cols-1 gap-x-2 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0"
    >
      {ASSURANCES.map(({ title, body, path }, i) => (
        <motion.li
          key={title}
          variants={staggerItem}
          className={[
            'flex items-center justify-center gap-3.5 text-left lg:justify-start lg:px-6',
            // Hairline between the columns only where they actually sit in a row.
            i > 0 ? 'lg:border-l lg:border-white/10' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7 shrink-0 text-azure"
            aria-hidden="true"
          >
            <path
              d={path}
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <p className="text-[13px] font-bold text-bone">{title}</p>
            <p className="mt-0.5 text-xs text-mist">{body}</p>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
}
