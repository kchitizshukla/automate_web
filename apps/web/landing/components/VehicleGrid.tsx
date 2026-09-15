'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — vehicle coverage grid

   The hero's right column: eight tiles saying, without a paragraph of copy,
   that "all vehicles" is meant literally. Purely illustrative — nothing here
   navigates, so the tiles are inert <li>s rather than buttons.

   The silhouettes are inline SVG on a shared 64×40 viewBox. Drawing them
   rather than loading eight photographs keeps the hero to a single network
   image, so the grid paints with the headline instead of popping in after it.
   ────────────────────────────────────────────── */

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/motion';

type Glyph = (p: { className?: string }) => JSX.Element;

/* Every silhouette shares one viewBox and one stroke weight, so the eight
   tiles read as a set rather than eight separate drawings. */
function Art({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 40"
      fill="none"
      className="h-12 w-full"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const Wheel = ({ cx, r = 4.4 }: { cx: number; r?: number }) => (
  <>
    <circle cx={cx} cy="31" r={r} stroke="currentColor" strokeWidth="2.2" />
    <circle cx={cx} cy="31" r={r * 0.32} fill="currentColor" opacity="0.7" />
  </>
);

const Car: Glyph = () => (
  <Art>
    <path
      d="M6 28v-5.3l3.6-7.2A5 5 0 0 1 14.1 13h21.6a5 5 0 0 1 3.9 1.9l6.1 7.6 5.9 1.5A4 4 0 0 1 54.7 28"
      stroke="currentColor"
      strokeWidth="2.2"
    />
    <path d="M6 28h48.7" stroke="currentColor" strokeWidth="2.2" />
    <path d="M13 22.3h26" stroke="currentColor" strokeWidth="1.8" opacity="0.55" />
    <path d="M25 13v9.3" stroke="currentColor" strokeWidth="1.8" opacity="0.55" />
    <Wheel cx={18} />
    <Wheel cx={45} />
  </Art>
);

const Bike: Glyph = () => (
  <Art>
    <circle cx="13" cy="28" r="7.5" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="51" cy="28" r="7.5" stroke="currentColor" strokeWidth="2.2" />
    <path
      d="M13 28l7-11h11l6 11M20 17h10m6 11-4.5-8"
      stroke="currentColor"
      strokeWidth="2.2"
    />
    <path d="M37 17h7l5 5-4 6" stroke="currentColor" strokeWidth="2.2" />
    <path d="M30 14h9" stroke="currentColor" strokeWidth="2.2" opacity="0.6" />
  </Art>
);

const Scooter: Glyph = () => (
  <Art>
    <circle cx="14" cy="29" r="6.5" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="50" cy="29" r="6.5" stroke="currentColor" strokeWidth="2.2" />
    <path
      d="M14 29h8l4-11h8a8 8 0 0 1 8 8v3"
      stroke="currentColor"
      strokeWidth="2.2"
    />
    <path d="M26 18 24 9h7" stroke="currentColor" strokeWidth="2.2" />
    <path d="M34 22h9" stroke="currentColor" strokeWidth="2" opacity="0.55" />
  </Art>
);

const Truck: Glyph = () => (
  <Art>
    <path d="M4 27V9h30v18" stroke="currentColor" strokeWidth="2.2" />
    <path d="M34 15h10l7 7v5" stroke="currentColor" strokeWidth="2.2" />
    <path d="M4 27h50" stroke="currentColor" strokeWidth="2.2" />
    <path d="M11 14h16M11 20h16" stroke="currentColor" strokeWidth="1.8" opacity="0.5" />
    <Wheel cx={16} r={4} />
    <Wheel cx={45} r={4} />
  </Art>
);

const Tractor: Glyph = () => (
  <Art>
    <circle cx="16" cy="27" r="8.5" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="47" cy="29" r="6" stroke="currentColor" strokeWidth="2.2" />
    <path d="M16 27V17h10l3-8h9v14" stroke="currentColor" strokeWidth="2.2" />
    <path d="M38 23h9v6" stroke="currentColor" strokeWidth="2.2" />
    <path d="M16 27h25" stroke="currentColor" strokeWidth="2.2" opacity="0.7" />
    <path d="M29 9h9" stroke="currentColor" strokeWidth="2.2" opacity="0.6" />
  </Art>
);

const Excavator: Glyph = () => (
  <Art>
    <rect x="8" y="17" width="20" height="11" rx="2.5" stroke="currentColor" strokeWidth="2.2" />
    <path d="M28 21l10-10 4 3-7 9" stroke="currentColor" strokeWidth="2.2" />
    <path d="M35 23l7 6-2 4" stroke="currentColor" strokeWidth="2.2" />
    <path d="M44 31h8l-2-5h-6" stroke="currentColor" strokeWidth="2.2" />
    <rect x="5" y="28" width="28" height="7" rx="3.5" stroke="currentColor" strokeWidth="2.2" />
    <path d="M13 28v7M25 28v7" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
  </Art>
);

const Van: Glyph = () => (
  <Art>
    <path d="M5 28V13a2 2 0 0 1 2-2h25l11 9v8" stroke="currentColor" strokeWidth="2.2" />
    <path d="M5 28h48" stroke="currentColor" strokeWidth="2.2" />
    <path d="M32 11v9h11" stroke="currentColor" strokeWidth="1.9" opacity="0.6" />
    <path d="M12 16h14" stroke="currentColor" strokeWidth="1.8" opacity="0.5" />
    <Wheel cx={17} />
    <Wheel cx={44} />
  </Art>
);

const Rv: Glyph = () => (
  <Art>
    <path d="M4 28V12a2 2 0 0 1 2-2h38a2 2 0 0 1 2 2v3l7 6v7" stroke="currentColor" strokeWidth="2.2" />
    <path d="M4 28h49" stroke="currentColor" strokeWidth="2.2" />
    <path d="M10 15h9v6h-9zM26 15h9v6h-9z" stroke="currentColor" strokeWidth="1.8" opacity="0.55" />
    <path d="M46 19h6" stroke="currentColor" strokeWidth="1.8" opacity="0.55" />
    <Wheel cx={16} r={4} />
    <Wheel cx={41} r={4} />
  </Art>
);

interface Category {
  label: string;
  Glyph: Glyph;
  /** Two-line labels get tighter leading so every tile keeps one height. */
  wrap?: boolean;
}

const CATEGORIES: Category[] = [
  { label: 'Cars', Glyph: Car },
  { label: 'Bikes', Glyph: Bike },
  { label: 'Scooters', Glyph: Scooter },
  { label: 'Trucks', Glyph: Truck },
  { label: 'Tractors', Glyph: Tractor },
  { label: 'Construction Vehicles', Glyph: Excavator, wrap: true },
  { label: 'Vans', Glyph: Van },
  { label: 'RVs & More', Glyph: Rv },
];

export function VehicleGrid() {
  return (
    <motion.div variants={staggerContainer(0.05)} className="w-full">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
        {CATEGORIES.map(({ label, Glyph, wrap }) => (
          <motion.li
            key={label}
            variants={staggerItem}
            className="group flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-navy-surface/80 px-3 pb-3 pt-4 text-center backdrop-blur-sm transition-colors duration-300 hover:border-azure/45 hover:bg-navy-raised/80"
          >
            <span className="flex w-full flex-1 items-center justify-center text-bone/80 transition-colors duration-300 group-hover:text-azure-glow">
              <Glyph />
            </span>
            <span
              className={[
                'text-[11px] font-semibold text-bone/90 sm:text-xs',
                wrap ? 'leading-[1.15]' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {label}
            </span>
          </motion.li>
        ))}
      </ul>

      {/* Closing caption, ruled on both sides. */}
      <motion.div variants={staggerItem} className="mt-6 flex items-center gap-4">
        <span aria-hidden className="rule-hairline h-px flex-1" />
        <p className="text-center text-[11px] font-medium text-mist sm:text-xs">
          From two wheels to heavy duty — we cover it all.
        </p>
        <span aria-hidden className="rule-hairline-r h-px flex-1" />
      </motion.div>
    </motion.div>
  );
}
