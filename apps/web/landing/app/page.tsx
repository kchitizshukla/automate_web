'use client';

/* ──────────────────────────────────────────────
   AutoMate — landing page

   The single entry point for all three segments:
   hero → role selection → feature highlights.
   Each role card routes to /<role>/auth, which stores
   the choice and hands off to that app's real login.
   ────────────────────────────────────────────── */

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { APP_NAME, ROLES, getRole } from '@automate/shared-brand';
import { Brandmark } from '@/components/Brandmark';
import { BrandLoader } from '@/components/BrandLoader';
import { HeroSection } from '@/components/HeroSection';
import { RoleSelection } from '@/components/RoleSelection';
import { FeatureHighlights } from '@/components/FeatureHighlights';
import { useRole } from '@/app/providers';
import { useLoader } from '@/components/GlobalLoader';
import { preconnect } from '@/lib/config';
import { fade, transition } from '@/lib/motion';

export default function LandingPage() {
  const rolesRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { role } = useRole();
  const { show } = useLoader();
  const [signingIn, setSigningIn] = useState(false);

  const scrollToRoles = useCallback(() => {
    rolesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /* Nav "Sign in".

     A returning visitor already has a role, so this is a real navigation and
     must show the overlay on the click itself. Without one, nothing at all
     happens on screen until the handoff route paints — the exact reason the
     button felt dead. With no role stored yet there is nothing to sign in to,
     so it stays a scroll to the role picker (synchronous — no loader). */
  const handleSignIn = useCallback(() => {
    if (signingIn) return;
    const chosen = role ? getRole(role) : undefined;
    if (!chosen) {
      scrollToRoles();
      return;
    }
    setSigningIn(true);
    show({
      message: `Continuing as ${chosen.label}`,
      detail: 'Taking you to sign in…',
      accent: chosen.accent,
    });
    preconnect(chosen.id);
    router.push(chosen.route);
  }, [signingIn, role, show, router, scrollToRoles]);

  return (
    <motion.main variants={fade} initial="hidden" animate="show" className="relative min-h-screen">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-graphite/85 backdrop-blur-xl">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Brandmark />
          <div className="flex items-center gap-2">
            <a
              href="#features"
              className="hidden rounded-xl px-3.5 py-2 text-sm font-medium text-white/65 transition-colors hover:text-bone sm:inline-block"
            >
              Features
            </a>
            <motion.button
              type="button"
              onClick={handleSignIn}
              onPointerEnter={() => role && preconnect(role)}
              disabled={signingIn}
              aria-busy={signingIn}
              whileHover={signingIn ? undefined : { scale: 1.04 }}
              whileTap={signingIn ? undefined : { scale: 0.96 }}
              transition={transition.snappy}
              className="inline-flex items-center gap-2 rounded-xl border border-white/18 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-bone backdrop-blur-md transition-colors hover:border-amber/60 disabled:cursor-progress disabled:opacity-70"
            >
              {signingIn && <BrandLoader size={16} monochrome />}
              {signingIn ? 'Signing in…' : 'Sign in'}
            </motion.button>
          </div>
        </nav>
      </header>

      <HeroSection onExplore={scrollToRoles} />

      <div ref={rolesRef}>
        <RoleSelection />
      </div>

      <FeatureHighlights />

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.07] px-5 py-10 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <Brandmark />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {ROLES.map((r) => (
              <Link
                key={r.id}
                href={r.route}
                onPointerEnter={() => preconnect(r.id)}
                // Same hand-off as the cards, so it gets the same feedback.
                onClick={() =>
                  show({
                    message: `Continuing as ${r.label}`,
                    detail: 'Preparing your sign-in…',
                    accent: r.accent,
                  })
                }
                className="text-sm text-white/55 transition-colors hover:text-amber"
              >
                {r.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} {APP_NAME}
          </p>
        </div>
      </footer>
    </motion.main>
  );
}
