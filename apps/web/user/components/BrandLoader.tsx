'use client';

// ──────────────────────────────────────────────
// The one activity mark for this app.
//
// Every loading state in the product renders this: page bodies, dropdown
// panels, buttons, the auth gate, route changes and the blocking overlay.
// There is no second spinner anywhere — size is the only thing that varies.
//
// Colours come from the --accent-1/2/3 CSS variables, so the user, mechanic
// and admin apps each get their own palette from the same component.
// Motion lives in globals.css (`.brand-loader*`), which also handles
// prefers-reduced-motion.
// ──────────────────────────────────────────────
import React from 'react';
import { classNames } from '@automate/shared-utils';

export interface BrandLoaderProps {
  /** Pixel size of the mark. Detail is dropped below 28px to stay legible. */
  size?: number;
  /** Paints the mark in the current text colour — for use inside a button. */
  monochrome?: boolean;
  className?: string;
}

export function BrandLoader({ size = 40, monochrome = false, className }: BrandLoaderProps) {
  // Unique per instance: two loaders on one page must not share a gradient id.
  const gid = React.useId().replace(/:/g, '');
  const detailed = size >= 28;

  const stroke = monochrome ? 'currentColor' : `url(#${gid})`;
  const track = monochrome ? 'currentColor' : 'rgb(var(--accent-1))';

  return (
    <span
      className={classNames('brand-loader', className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      {detailed && !monochrome && <span className="brand-loader__halo" aria-hidden />}

      <svg
        className="brand-loader__svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
      >
        {!monochrome && (
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent-1))" />
              <stop offset="50%" stopColor="rgb(var(--accent-2))" />
              <stop offset="100%" stopColor="rgb(var(--accent-3))" />
            </linearGradient>
          </defs>
        )}

        {/* Faint full ring, so the sweep reads as travelling along a track. */}
        <circle cx="24" cy="24" r="19" stroke={track} strokeOpacity="0.14" strokeWidth="3.5" />

        {/* Outer comet. */}
        <g className="brand-loader__arc-outer">
          <circle
            className="brand-loader__comet"
            cx="24"
            cy="24"
            r="19"
            stroke={stroke}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>

        {/* Inner counter-rotating arc — the layer that stops it reading as a
            plain circular spinner. Dropped at small sizes where it turns to mud. */}
        {detailed && (
          <g className="brand-loader__arc-inner">
            <circle
              cx="24"
              cy="24"
              r="11"
              stroke={stroke}
              strokeOpacity="0.55"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="18 52"
            />
          </g>
        )}
      </svg>

      {detailed && !monochrome && (
        <span
          className="brand-loader__core"
          style={{ width: size * 0.2, height: size * 0.2 }}
          aria-hidden
        />
      )}
    </span>
  );
}

/**
 * The in-body loading state: the mark plus a label. This is what every screen
 * shows while its data is on the way.
 */
export function InlineLoader({
  label = 'Loading…',
  size = 40,
  className,
}: {
  label?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={classNames('flex flex-col items-center justify-center gap-3 py-16', className)}
      role="status"
      aria-live="polite"
    >
      <BrandLoader size={size} />
      <span className="text-sm font-medium text-slate-500">{label}</span>
    </div>
  );
}

/** The indeterminate top bar, shared by route changes and in-flight requests. */
export function BrandLoaderBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9998] h-[3px] overflow-hidden" aria-hidden>
      <div className="brand-loader-bar h-full w-1/3 rounded-full" />
    </div>
  );
}

/**
 * The whole-page loading state, used while the app cannot yet show anything
 * truthful: session restoration on first paint, and the redirect that follows
 * it.
 *
 * It replaces the old bare "Checking session…" spinner. The point of the
 * change is that the gate now looks like AutoMate rather than like a blank
 * page with a wheel on it — the wordmark is present, so a slow session check
 * reads as the app starting up rather than as nothing having loaded.
 *
 * It is a plain block element, not an overlay: it *is* the page at this
 * moment, so there is nothing underneath to dim, no scroll lock to apply and
 * no focus to trap.
 */
export function FullScreenLoader({
  label = 'Loading…',
  detail,
  className,
}: {
  label?: string;
  detail?: string;
  className?: string;
}) {
  return (
    <div
      className={classNames(
        'flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6 py-16 text-center',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-aurora text-xl text-white shadow-glow">
          ⚡
        </span>
        <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
          AutoMate
        </span>
      </span>

      <BrandLoader size={64} />

      <span>
        <span className="block text-sm font-semibold text-slate-700">{label}</span>
        {detail && <span className="mt-1 block text-xs text-slate-500">{detail}</span>}
      </span>
    </div>
  );
}
