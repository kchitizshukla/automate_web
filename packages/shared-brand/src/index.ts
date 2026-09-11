/* ──────────────────────────────────────────────
   @automate/shared-brand

   Platform-agnostic brand constants consumed by both
   the Next.js landing app and the three Expo apps.
   Nothing here may import `react`, `react-dom` or
   `react-native` — keep it plain data.
   ────────────────────────────────────────────── */

export const APP_NAME = 'AutoMate';
export const TAGLINE = 'Smart Vehicle Service & Management Platform';
export const SUBTEXT =
  'Connecting vehicle owners, mechanics, and administrators in one seamless ecosystem.';

/** Key under which the landing page persists the chosen role. */
export const ROLE_STORAGE_KEY = 'am_selected_role';

/** Feature highlights shown beneath the role selector. */
export interface FeatureHighlight {
  title: string;
  body: string;
  /** Ionicons glyph — used by the mobile surface. */
  icon: string;
}

export const FEATURES: readonly FeatureHighlight[] = [
  {
    title: 'Book in seconds',
    body: 'Pick a service, choose a slot and confirm — no phone calls, no waiting rooms.',
    icon: 'flash',
  },
  {
    title: 'Verified mechanics',
    body: 'Every workshop is approved by an admin and rated by real vehicle owners.',
    icon: 'ribbon',
  },
  {
    title: 'Live job tracking',
    body: 'Watch a request move from accepted to completed, with updates at every step.',
    icon: 'pulse',
  },
  {
    title: 'Unified analytics',
    body: 'One console for approvals, assignments, payments and platform health.',
    icon: 'stats-chart',
  },
] as const;

/** Headline numbers used as social proof on the hero. */
export const STATS: readonly { value: string; label: string }[] = [
  { value: '12k+', label: 'Services completed' },
  { value: '850+', label: 'Verified mechanics' },
  { value: '4.9', label: 'Average rating' },
] as const;

export * from './colors';
export * from './images';
export * from './roles';
