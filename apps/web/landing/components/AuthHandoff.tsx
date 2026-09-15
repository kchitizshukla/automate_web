'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — auth handoff

   Each role lives in its own Next.js app on its own origin, so `/user/auth`
   can't simply render that app's login. Instead it persists the selected
   role, shows a branded transition, then forwards to the real login/signup
   screen.

   The redirect is deferred and cancellable, so nobody gets thrown across
   origins before they can read where they're going.

   Two things make the wait short as well as legible:

     • the destination origin is preconnected the moment this page mounts, so
       the DNS/TCP/TLS handshake is already done when the redirect fires — on a
       cold connection that was the bulk of the delay, and
     • pressing Sign in raises the global overlay *synchronously*, before the
       assignment to `location.href`. A cross-origin navigation paints nothing
       until the new document is ready, so without this the click looks
       ignored for as long as the role app takes to answer.

   Every path out of here is one-way, so `leaving` latches: the auto-redirect
   and both buttons check it, and a second press can't fire a second
   navigation.
   ────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getRole, type RoleId } from '@automate/shared-brand';
import { Backdrop } from './Backdrop';
import { Brandmark } from './Brandmark';
import { RoleIcon } from './RoleIcon';
import { BrandLoader } from './BrandLoader';
import { useRole } from '@/app/providers';
import { useLoader } from './GlobalLoader';
import { authUrlFor, preconnect } from '@/lib/config';
import { presentationFor } from '@/lib/roles';
import { staggerContainer, staggerItem, transition, usePrefersReducedMotion } from '@/lib/motion';

/* Long enough to read "Continuing as …", short enough not to feel like a
   stall. The connection is being warmed in parallel, so this is the whole
   remaining cost of the hop rather than a delay stacked on top of it. */
const REDIRECT_MS = 900;

export function AuthHandoff({ roleId }: { roleId: RoleId }) {
  const role = getRole(roleId)!;
  // Same copy and accent the card on the landing page wore, so the hand-off
  // reads as a continuation of the thing that was clicked.
  const look = presentationFor(roleId);
  const { selectRole } = useRole();
  const { show, hide } = useLoader();
  const reduced = usePrefersReducedMotion();
  const [cancelled, setCancelled] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  // Persist the choice as soon as the route mounts — even if the visitor
  // cancels the redirect, the selection is what they asked for.
  useEffect(() => {
    selectRole(roleId);
  }, [roleId, selectRole]);

  // This page has arrived, so whatever overlay covered the click that brought
  // us here has done its job. (GlobalLoader also lowers it on the pathname
  // change; this covers a direct hit on /<role>/auth.)
  useEffect(() => {
    hide();
    preconnect(roleId);
  }, [hide, roleId]);

  /** The single exit. Idempotent — later calls are ignored. */
  const leave = useCallback(
    (mode: 'login' | 'signup') => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setLeaving(true);
      window.clearTimeout(timer.current);

      // Raised before the navigation, so the feedback is on the click and not
      // on whenever the other origin gets around to responding.
      show({
        message: mode === 'signup' ? 'Opening sign-up' : 'Signing you in',
        detail: `Taking you to the ${look.label} app…`,
        accent: look.accent,
      });

      /* Assigning `location.href` in this tick would race React's commit: the
         browser can start tearing down the document before the overlay has
         ever been painted, and the click would look ignored after all. Two
         frames is the cheapest guarantee that it reached the screen first —
         ~32ms, against a cross-origin document load.

         rAF alone would be a trap, though: a backgrounded tab stops painting,
         the callbacks never run, and the visitor comes back to a page that
         never went anywhere. So a timer races the frames and whichever
         arrives first wins. */
      const url = authUrlFor(roleId, mode);
      let gone = false;
      const go = () => {
        if (gone) return;
        gone = true;
        window.location.href = url;
      };
      requestAnimationFrame(() => requestAnimationFrame(go));
      window.setTimeout(go, 120);
    },
    [roleId, look.label, look.accent, show],
  );

  useEffect(() => {
    if (cancelled || leaving) return;
    timer.current = window.setTimeout(() => leave('login'), REDIRECT_MS);
    return () => window.clearTimeout(timer.current);
  }, [cancelled, leaving, leave]);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-16">
      <Backdrop src={role.image} opacity={0.35} animated className="-z-10" />

      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
        className="panel w-full max-w-md rounded-3xl p-8 text-center sm:p-10"
      >
        <motion.div variants={staggerItem} className="flex justify-center">
          <Brandmark />
        </motion.div>

        <motion.span
          variants={staggerItem}
          className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-2xl border"
          style={{
            background: `${look.accent}1f`,
            borderColor: `${look.accent}55`,
            color: look.accent,
          }}
        >
          <RoleIcon role={role.id} className="h-11 w-11" />
        </motion.span>

        <motion.h1 variants={staggerItem} className="mt-6 font-display text-2xl font-bold text-bone">
          Continuing as {look.label}
        </motion.h1>
        <motion.p variants={staggerItem} className="mt-2 text-sm leading-relaxed text-mist">
          {look.description}
        </motion.p>

        {/* Redirect progress */}
        <motion.div
          variants={staggerItem}
          className="mt-8 h-1 w-full overflow-hidden rounded-full bg-white/12"
        >
          {!cancelled && !leaving && (
            <motion.div
              className="h-full rounded-full"
              style={{ background: look.accent }}
              initial={{ width: reduced ? '100%' : '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: REDIRECT_MS / 1000, ease: 'linear' }}
            />
          )}
        </motion.div>
        <motion.p variants={staggerItem} className="mt-3 text-xs text-mist" aria-live="polite">
          {leaving
            ? `Opening the ${look.label} app…`
            : cancelled
              ? 'Redirect paused — pick an option below.'
              : 'Taking you to sign in…'}
        </motion.p>

        <motion.div variants={staggerItem} className="mt-7 flex flex-col gap-2.5">
          {/* Buttons, not links: the navigation has to be latched and the
              overlay raised before the browser leaves the origin. */}
          <motion.button
            type="button"
            onClick={() => leave('login')}
            disabled={leaving}
            aria-busy={leaving}
            whileHover={leaving ? undefined : { scale: 1.02 }}
            whileTap={leaving ? undefined : { scale: 0.98 }}
            transition={transition.snappy}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold disabled:cursor-progress"
            style={{ background: look.accent, color: look.onAccent }}
          >
            {leaving && <BrandLoader size={16} monochrome />}
            {leaving ? 'Signing in…' : 'Sign in'}
          </motion.button>
          <button
            type="button"
            onClick={() => leave('signup')}
            disabled={leaving}
            className="rounded-xl border border-white/18 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-bone transition-colors hover:border-white/35 disabled:cursor-progress disabled:opacity-60"
          >
            Create an account
          </button>
        </motion.div>

        <motion.div variants={staggerItem} className="mt-6 flex items-center justify-center gap-4 text-xs">
          {!cancelled && !leaving && (
            <button
              type="button"
              onClick={() => setCancelled(true)}
              className="text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
            >
              Stay here
            </button>
          )}
          <Link
            href="/"
            className="text-mist underline-offset-4 transition-colors hover:text-bone hover:underline"
            onClick={() => setCancelled(true)}
          >
            Choose a different role
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
