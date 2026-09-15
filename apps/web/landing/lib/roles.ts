/* ──────────────────────────────────────────────
   AutoMate landing — role presentation layer

   @automate/shared-brand owns the *identity* of each segment: its id, the
   route the hand-off pushes, the storage key, the mobile copy. That package
   is shared with the native apps, so this page must not reach in and restyle
   it.

   What lives here is only how the landing page *presents* those three roles —
   the short marketing copy, the CTA wording and the accent each card is
   painted in. Nothing here changes where a card goes: `route` and `id` still
   come straight from the shared definition.
   ────────────────────────────────────────────── */

import type { RoleDefinition, RoleId } from '@automate/shared-brand';

export interface RolePresentation {
  /** Card heading. */
  label: string;
  /** Two-line supporting copy. */
  description: string;
  /** Button wording. */
  cta: string;
  /** Solid accent — icon medallion, button fill, border tint. */
  accent: string;
  /** Lighter step of the accent, used for the button's hover state. */
  accentSoft: string;
  /** Card panel wash, from the accent's own family. */
  surface: string;
  /** Card border. */
  border: string;
  /** Text colour that stays legible on top of `accent`. */
  onAccent: string;
}

const PRESENTATION: Record<RoleId, RolePresentation> = {
  user: {
    label: 'Vehicle Owner',
    description:
      'Find trusted mechanics, book services, and keep your vehicle in top condition.',
    cta: 'Continue as Owner',
    accent: '#2B8FFF',
    accentSoft: '#4DA3FF',
    surface: 'linear-gradient(150deg, #103866 0%, #0E2B4E 55%, #0B2340 100%)',
    border: 'rgba(43, 143, 255, 0.45)',
    onAccent: '#FFFFFF',
  },
  mechanic: {
    label: 'Mechanic',
    description: 'Manage your workshop, handle bookings, and grow your business.',
    cta: 'Continue as Mechanic',
    accent: '#16A97F',
    accentSoft: '#2FC79A',
    surface: 'linear-gradient(150deg, #0E3B33 0%, #0C2F2A 55%, #0A2621 100%)',
    border: 'rgba(22, 169, 127, 0.45)',
    onAccent: '#04231B',
  },
  admin: {
    label: 'Admin',
    description:
      'Oversee operations, manage users, and ensure smooth platform performance.',
    cta: 'Continue as Admin',
    accent: '#E5902B',
    accentSoft: '#F5A94A',
    surface: 'linear-gradient(150deg, #4A2F0F 0%, #3B250D 55%, #2F1D0A 100%)',
    border: 'rgba(229, 144, 43, 0.45)',
    onAccent: '#2A1805',
  },
};

export function presentationFor(role: RoleDefinition | RoleId): RolePresentation {
  return PRESENTATION[typeof role === 'string' ? role : role.id];
}

/** The accent the loading overlay should wear while `role` is resolving. */
export function accentFor(role: RoleDefinition | RoleId): string {
  return presentationFor(role).accent;
}
