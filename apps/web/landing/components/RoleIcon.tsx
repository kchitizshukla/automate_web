/* ──────────────────────────────────────────────
   AutoMate landing — role glyphs

   Inline SVG (no icon-font request, no layout shift).
   `currentColor` lets the RoleCard tint each glyph with
   the role's accent without duplicating the markup.
   ────────────────────────────────────────────── */

import type { RoleId } from '@automate/shared-brand';

type IconProps = { className?: string };

/** Vehicle owner — a car in three-quarter silhouette. */
function CarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 30v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2h16v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M6 30v-5.2a4 4 0 0 1 .9-2.5l5.4-6.7A5 5 0 0 1 16.2 13h15.6a5 5 0 0 1 3.9 1.9l5.4 6.7a4 4 0 0 1 .9 2.5V30a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M9 23h30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity=".55" />
      <circle cx="14" cy="27" r="2" fill="currentColor" />
      <circle cx="34" cy="27" r="2" fill="currentColor" />
    </svg>
  );
}

/** Mechanic — crossed wrench and screwdriver. */
function WrenchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M30.5 8.5a9 9 0 0 0-11.2 11.6L8.9 30.5a3.7 3.7 0 0 0 5.2 5.2l10.4-10.4A9 9 0 0 0 36.2 14l-5 5-4.2-4.2 5-5a9 9 0 0 0-1.5-1.3Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M12 32.5h.02" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      <path
        d="M31 30l7.5 7.5a2.8 2.8 0 0 1-4 4L27 34"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".6"
      />
    </svg>
  );
}

/** Admin — shield with a pulse line, echoing the analytics console. */
function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 6l14 5v11c0 9.1-5.9 16.6-14 20-8.1-3.4-14-10.9-14-20V11l14-5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M16 25h4l2.5-5.5L27 30l2.2-5H33"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS: Record<RoleId, (p: IconProps) => JSX.Element> = {
  user: CarIcon,
  mechanic: WrenchIcon,
  admin: ShieldIcon,
};

export function RoleIcon({ role, className }: { role: RoleId; className?: string }) {
  const Glyph = ICONS[role];
  return <Glyph className={className} />;
}
