/* ──────────────────────────────────────────────
   AutoMate — role definitions

   Single source of truth for the three user segments
   shown on the landing page. Web reads `route`, mobile
   reads `scheme` / `authScreen`; the copy, accents and
   photography are shared so both platforms stay in sync.
   ────────────────────────────────────────────── */

import { palette } from './colors';
import { IMAGES } from './images';

export type RoleId = 'user' | 'mechanic' | 'admin';

export interface RoleDefinition {
  id: RoleId;
  /** Card title. */
  label: string;
  /** One-line positioning under the title. */
  description: string;
  /** Call-to-action button copy. */
  cta: string;
  /** Web route on the landing app. */
  route: `/${RoleId}/auth`;
  /** Expo deep-link scheme of the matching mobile app. */
  scheme: `automate-${RoleId}`;
  /** Signature accent (icon tint, rule, border highlight). */
  accent: string;
  /** Secondary stop for the card's gradient wash. */
  accentAlt: string;
  /** Ionicons glyph — used by the mobile RoleCard. */
  icon: string;
  /** Card background photograph. */
  image: string;
  /** Three short proof-points listed on the card. */
  highlights: [string, string, string];
}

export const ROLES: readonly RoleDefinition[] = [
  {
    id: 'user',
    label: 'Vehicle Owner',
    description:
      'Book trusted mechanics, track every service in real time and keep your vehicle history in one place.',
    cta: 'Continue as User',
    route: '/user/auth',
    scheme: 'automate-user',
    accent: palette.amber,
    accentAlt: palette.amberDeep,
    icon: 'car-sport',
    image: IMAGES.owner,
    highlights: ['Instant booking', 'Live job tracking', 'Service history'],
  },
  {
    id: 'mechanic',
    label: 'Mechanic',
    description:
      'Receive nearby job requests, manage your service catalogue and get paid without the paperwork.',
    cta: 'Continue as Mechanic',
    route: '/mechanic/auth',
    scheme: 'automate-mechanic',
    accent: palette.copper,
    accentAlt: palette.copperSoft,
    icon: 'construct',
    image: IMAGES.mechanic,
    highlights: ['Job queue', 'Service catalogue', 'Earnings payouts'],
  },
  {
    id: 'admin',
    label: 'Admin',
    description:
      'Approve mechanics, assign jobs and watch platform health from a single analytics console.',
    cta: 'Continue as Admin',
    route: '/admin/auth',
    scheme: 'automate-admin',
    accent: palette.steel,
    accentAlt: palette.steelSoft,
    icon: 'shield-checkmark',
    image: IMAGES.admin,
    highlights: ['Approvals queue', 'Job assignment', 'Live analytics'],
  },
] as const;

export const ROLE_IDS: readonly RoleId[] = ROLES.map((r) => r.id);

export function getRole(id: string): RoleDefinition | undefined {
  return ROLES.find((r) => r.id === id);
}

export function isRoleId(value: unknown): value is RoleId {
  return typeof value === 'string' && ROLE_IDS.includes(value as RoleId);
}
