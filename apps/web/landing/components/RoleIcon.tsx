/* ──────────────────────────────────────────────
   AutoMate landing — role glyphs

   Inline SVG (no icon-font request, no layout shift).
   `currentColor` lets the RoleCard tint each glyph with
   the role's accent without duplicating the markup.
   ────────────────────────────────────────────── */

import type { RoleId } from '@automate/shared-brand';

type IconProps = { className?: string };

/** Vehicle owner — a person, since the card speaks to the driver not the car. */
function PersonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="17" r="7.5" stroke="currentColor" strokeWidth="3" />
      <path
        d="M10.5 39.5a13.5 13.5 0 0 1 27 0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Mechanic — a wrench held at the working angle. */
function WrenchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M31.6 7.4a10 10 0 0 0-12.4 12.9L8.4 31.1a4.1 4.1 0 0 0 5.8 5.8l10.8-10.8A10 10 0 0 0 38 13.7l-5.6 5.6-4.7-4.7 5.5-5.6a10 10 0 0 0-1.6-1.6Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M11.6 33.7h.02" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Admin — shield with a cog, echoing the operations console. */
function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 5.5 38 11v10.5c0 9-5.8 16.4-14 19.8-8.2-3.4-14-10.8-14-19.8V11l14-5.5Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="21" r="3.6" stroke="currentColor" strokeWidth="2.6" />
      <path
        d="M24 13.6v2.2M24 26.2v2.2M30.4 17.3l-1.9 1.1M19.5 23.6l-1.9 1.1M30.4 24.7l-1.9-1.1M19.5 18.4l-1.9-1.1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICONS: Record<RoleId, (p: IconProps) => JSX.Element> = {
  user: PersonIcon,
  mechanic: WrenchIcon,
  admin: ShieldIcon,
};

export function RoleIcon({ role, className }: { role: RoleId; className?: string }) {
  const Glyph = ICONS[role];
  return <Glyph className={className} />;
}
