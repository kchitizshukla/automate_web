/* ──────────────────────────────────────────────
   AutoMate landing — destination config

   Each role lives in its own Next.js app (own port in
   dev, own host in prod). The landing app owns the
   `/user/auth` · `/mechanic/auth` · `/admin/auth`
   routes and hands off to the matching app's real
   login/signup screens.
   ────────────────────────────────────────────── */

import type { RoleId } from '@automate/shared-brand';

/** Dev defaults match the ports in each app's package.json. */
const DEFAULT_ORIGINS: Record<RoleId, string> = {
  user: 'http://localhost:3001',
  mechanic: 'http://localhost:3002',
  admin: 'http://localhost:3003',
};

/* NEXT_PUBLIC_* vars must be referenced statically — Next inlines them at
   build time, so `process.env[key]` would resolve to undefined. */
const ORIGIN_OVERRIDES: Record<RoleId, string | undefined> = {
  user: process.env.NEXT_PUBLIC_USER_APP_URL,
  mechanic: process.env.NEXT_PUBLIC_MECHANIC_APP_URL,
  admin: process.env.NEXT_PUBLIC_ADMIN_APP_URL,
};

export function originFor(role: RoleId): string {
  return (ORIGIN_OVERRIDES[role] || DEFAULT_ORIGINS[role]).replace(/\/$/, '');
}

/** Absolute URL of a role's login or signup screen. */
export function authUrlFor(role: RoleId, mode: 'login' | 'signup' = 'login'): string {
  return `${originFor(role)}/${mode}`;
}

/* ──────────────────────────────────────────────
   Warming the destination origin.

   The hand-off ends in a cross-origin document load, so the browser has a
   fresh DNS lookup + TCP + TLS handshake to do before the role app sends a
   single byte — on a cold connection that is most of the wait the visitor
   reads as "the button didn't work".

   Calling this on hover/selection moves that handshake off the critical path.
   It is idempotent: the tag is keyed by origin and reused.
   ────────────────────────────────────────────── */
export function preconnect(role: RoleId): void {
  if (typeof document === 'undefined') return;
  const origin = originFor(role);
  // localhost in dev gains nothing and just adds noise to the network panel.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(origin)) return;
  if (document.head.querySelector(`link[data-preconnect="${origin}"]`)) return;

  for (const rel of ['preconnect', 'dns-prefetch'] as const) {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = origin;
    if (rel === 'preconnect') link.crossOrigin = '';
    link.dataset.preconnect = origin;
    document.head.appendChild(link);
  }
}
