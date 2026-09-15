'use client';

/* ──────────────────────────────────────────────
   AutoMate — landing page

   The single entry point for all three segments:
   hero → role selection → feature highlights.
   Each role card routes to /<role>/auth, which stores
   the choice and hands off to that app's real login.
   ────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { presentationFor } from '@/lib/roles';
import { fade, transition } from '@/lib/motion';

/** Nav destinations, in document order — the scroll-spy relies on that order. */
const NAV_LINKS = [
  { id: 'top', label: 'Home' },
  { id: 'features', label: 'How it works' },
  { id: 'services', label: 'Services' },
  { id: 'for-mechanics', label: 'For mechanics' },
] as const;

export default function LandingPage() {
  const rolesRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { role } = useRole();
  const { show } = useLoader();
  const [signingIn, setSigningIn] = useState(false);
  const [active, setActive] = useState<string>('top');

  const scrollToRoles = useCallback(() => {
    rolesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /* Scroll-spy for the nav. An observer band across the upper third of the
     viewport means a section counts as "current" once its top reaches reading
     height, which is what the eye is doing anyway — measuring on every scroll
     event would cost a layout read per frame for the same answer. */
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const targets = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
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
    const look = presentationFor(chosen);
    setSigningIn(true);
    show({
      message: `Continuing as ${look.label}`,
      detail: 'Taking you to sign in…',
      accent: look.accent,
    });
    preconnect(chosen.id);
    router.push(chosen.route);
  }, [signingIn, role, show, router, scrollToRoles]);

  return (
    <motion.main variants={fade} initial="hidden" animate="show" className="relative min-h-screen">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-navy-deep/85 backdrop-blur-xl">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <a href="#top" aria-label={`${APP_NAME} home`}>
            <Brandmark size="lg" />
          </a>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={active === link.id ? 'true' : undefined}
                className="relative rounded-lg px-3.5 py-2 text-sm font-medium text-bone/70 transition-colors hover:text-bone"
              >
                {link.label}
                {/* Underline for the section currently in view. */}
                <span
                  aria-hidden
                  className={[
                    'absolute inset-x-3.5 -bottom-[3px] h-0.5 rounded-full bg-azure transition-opacity duration-300',
                    active === link.id ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                />
              </a>
            ))}
          </div>

          <motion.button
            type="button"
            onClick={handleSignIn}
            onPointerEnter={() => role && preconnect(role)}
            disabled={signingIn}
            aria-busy={signingIn}
            whileHover={signingIn ? undefined : { scale: 1.04 }}
            whileTap={signingIn ? undefined : { scale: 0.96 }}
            transition={transition.snappy}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-azure/55 bg-azure/[0.08] px-5 py-2 text-sm font-semibold text-bone backdrop-blur-md transition-colors hover:border-azure hover:bg-azure/20 disabled:cursor-progress disabled:opacity-70"
          >
            {signingIn ? (
              <BrandLoader size={16} monochrome />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <circle cx="12" cy="8.5" r="3.6" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M5.5 19.5a6.5 6.5 0 0 1 13 0"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {signingIn ? 'Signing in…' : 'Sign In'}
          </motion.button>
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
            {ROLES.map((r) => {
              const look = presentationFor(r);
              return (
                <Link
                  key={r.id}
                  href={r.route}
                  onPointerEnter={() => preconnect(r.id)}
                  // Same hand-off as the cards, so it gets the same feedback.
                  onClick={() =>
                    show({
                      message: `Continuing as ${look.label}`,
                      detail: 'Preparing your sign-in…',
                      accent: look.accent,
                    })
                  }
                  className="text-sm text-mist transition-colors hover:text-azure"
                >
                  {look.label}
                </Link>
              );
            })}
          </nav>
          <p className="text-xs text-mist">
            © {new Date().getFullYear()} {APP_NAME}
          </p>
        </div>
      </footer>
    </motion.main>
  );
}
