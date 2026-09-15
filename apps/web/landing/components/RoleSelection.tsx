'use client';

/* ──────────────────────────────────────────────
   AutoMate landing — role selection

   Stores the picked segment in the RoleProvider, then routes to the matching
   `/<role>/auth` handoff page. Grid on desktop → single stacked column on
   mobile.

   Picking a role is *not* synchronous: it is an App Router navigation to a
   route that then leaves this origin entirely. So the click raises the global
   overlay immediately and latches `pending`, which both gives feedback and
   makes a second click a no-op — the App Router happily pushes the same route
   twice otherwise.

   The overlay is lowered by GlobalLoader when the new pathname renders, so
   there is no timer here to get out of step with the navigation.
   ────────────────────────────────────────────── */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ROLES, type RoleDefinition, type RoleId } from '@automate/shared-brand';
import { RoleCard } from './RoleCard';
import { TrustStrip } from './TrustStrip';
import { useRole } from '@/app/providers';
import { useLoader } from './GlobalLoader';
import { preconnect } from '@/lib/config';
import { presentationFor } from '@/lib/roles';
import { staggerContainer, staggerItem } from '@/lib/motion';

export function RoleSelection({ id = 'roles' }: { id?: string }) {
  const router = useRouter();
  const { selectRole } = useRole();
  const { show } = useLoader();
  const [pending, setPending] = useState<RoleId | null>(null);

  const handleSelect = useCallback(
    (role: RoleDefinition) => {
      // One selection at a time — a second tap must not push a duplicate route.
      if (pending) return;
      setPending(role.id);

      const look = presentationFor(role);
      selectRole(role.id);
      show({
        message: `Continuing as ${look.label}`,
        detail: 'Preparing your sign-in…',
        accent: look.accent,
      });
      // Start the handshake with the role app now; the handoff page redirects
      // there moments later.
      preconnect(role.id);
      router.push(role.route);
    },
    [pending, router, selectRole, show],
  );

  /** Warm both hops for the card under the pointer. */
  const warm = useCallback(
    (role: RoleDefinition) => {
      router.prefetch(role.route);
      preconnect(role.id);
    },
    [router],
  );

  return (
    <section
      id={id}
      className="relative scroll-mt-20 bg-navy-ink/60 px-5 py-16 sm:px-8 sm:py-20"
    >
      <motion.div
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="mx-auto w-full max-w-7xl"
      >
        <motion.p
          variants={staggerItem}
          className="text-center text-[11px] font-bold uppercase tracking-widest text-azure"
        >
          Get started
        </motion.p>
        <motion.h2
          variants={staggerItem}
          className="mt-3.5 text-center font-display text-3xl font-bold text-bone sm:text-[2.35rem]"
        >
          Choose Your Role
        </motion.h2>
        <motion.p
          variants={staggerItem}
          className="mx-auto mt-3 max-w-xl text-center text-sm text-mist sm:text-[15px]"
        >
          Select how you want to use AutoMate and get started in just a few clicks.
        </motion.p>

        <div className="mt-11 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onSelect={handleSelect}
              onWarm={warm}
              pending={pending === role.id}
              // Every card locks while one is resolving, so the visitor can't
              // start a second hand-off on top of the first.
              disabled={pending !== null}
            />
          ))}
        </div>

        <TrustStrip />
      </motion.div>
    </section>
  );
}
