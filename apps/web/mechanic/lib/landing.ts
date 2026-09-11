/* ──────────────────────────────────────────────
   Link back to the common AutoMate landing page.

   The landing app (default :3000) owns role selection;
   every role app links back to it so a visitor who
   arrived at the wrong sign-in can switch without
   having to know the other apps' ports.
   ────────────────────────────────────────────── */

export const LANDING_URL = (
  process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000'
).replace(/\/$/, '');

/** The landing page's role-selection section. */
export const ROLE_SELECT_URL = `${LANDING_URL}/#roles`;
