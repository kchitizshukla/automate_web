'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — role card artwork

   The decorative figure in the top-right of each role card: a car for the
   owner, a mechanic in overalls, an administrator at the desk. Drawn in the
   card's own accent at low opacity so it sits behind the copy rather than
   competing with it — which is also why every path uses `currentColor` and
   the card sets the colour.

   Purely ornamental, so the whole SVG is aria-hidden.
   ────────────────────────────────────────────── */

import type { RoleId } from '@automate/shared-brand';

type ArtProps = { className?: string };

/** Vehicle owner — a car in three-quarter profile. */
function CarArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 72" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 52v-9.5l9-16A11 11 0 0 1 26.7 21h49.6a11 11 0 0 1 8.6 4.1l12.4 15.4 11.7 3.2a7 7 0 0 1 5 6.7V52"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M8 52h105" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M24 41h56M50 21v20"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="33" cy="55" r="9" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3" />
      <circle cx="92" cy="55" r="9" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

/** Mechanic — cap, overalls, wrench in hand. */
function MechanicArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 72" fill="none" className={className} aria-hidden="true">
      {/* Cap */}
      <path
        d="M44 20a14 14 0 0 1 28 0H44Z"
        fill="currentColor"
        fillOpacity="0.32"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M40 20h38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Head */}
      <circle cx="58" cy="29" r="8" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="3" />
      {/* Torso + overall straps */}
      <path
        d="M36 70V53a15 15 0 0 1 15-15h14a15 15 0 0 1 15 15v17"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M52 39v10a6 6 0 0 0 12 0V39"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.65"
      />
      {/* Raised arm holding an open-ended wrench */}
      <path d="M79 53l11-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M90 45.5 100 38"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M98.5 39.5a6.5 6.5 0 0 1 9.5-1.5l-4.6 3.5 1.3 4.4 5.2-1.1a6.5 6.5 0 0 1-9.6 2.3"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Admin — figure in a collar and tie, behind the console. */
function AdminArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 72" fill="none" className={className} aria-hidden="true">
      <circle cx="60" cy="24" r="11" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="3" />
      <path
        d="M34 70V58a16 16 0 0 1 16-16h20a16 16 0 0 1 16 16v12"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Collar and tie */}
      <path d="M52 43l8 8 8-8" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path
        d="M60 51l-3.5 6 3.5 9 3.5-9-3.5-6Z"
        fill="currentColor"
        fillOpacity="0.45"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Console edge */}
      <path d="M18 70h84" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

const ART: Record<RoleId, (p: ArtProps) => JSX.Element> = {
  user: CarArt,
  mechanic: MechanicArt,
  admin: AdminArt,
};

export function RoleArt({ role, className }: { role: RoleId; className?: string }) {
  const Art = ART[role];
  return <Art className={className} />;
}
