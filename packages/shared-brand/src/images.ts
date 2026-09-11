/* ──────────────────────────────────────────────
   AutoMate — background photography

   Remote Unsplash URLs, matching the convention already
   used by apps/web/user/lib/catalog.ts. Every image is
   laid under a graphite gradient scrim, so if a request
   fails the surface degrades to the flat canvas colour
   instead of breaking the layout.

   `w`/`q` are tuned per slot: large hero, smaller cards.
   ────────────────────────────────────────────── */

const UNSPLASH = 'https://images.unsplash.com/photo-';

function shot(id: string, width: number, quality = 60): string {
  return `${UNSPLASH}${id}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

export const IMAGES = {
  /** Showroom floor at night — the hero backdrop. */
  hero: shot('1492144534655-ae79c964c9d7', 1920, 65),
  /** Same frame, mobile-sized. */
  heroMobile: shot('1492144534655-ae79c964c9d7', 900, 55),

  /** Vehicle owner — a car on the move. */
  owner: shot('1503376780353-7e6692767b70', 900),
  /** Mechanic — hands and a wrench on an engine. */
  mechanic: shot('1619642751034-765dfdf7c58e', 900),
  /** Admin — an analytics dashboard. */
  admin: shot('1551288049-bebda4e38f71', 900),

  /** Workshop tool wall — section band. */
  workshop: shot('1530046339160-ce3e530c7d2f', 1600),
  /** Engine bay close-up — texture panel. */
  engine: shot('1486262715619-67b85e0b08d3', 1200),
} as const;

export type ImageKey = keyof typeof IMAGES;
