'use client';

// ──────────────────────────────────────────────
// The one activity mark for the landing app.
//
// Geometry, timing and layering are identical to the role apps'
// components/BrandLoader.tsx (same 48-unit viewBox, same 1.15s orbit, same
// counter-rotating inner arc), so a visitor crossing from the landing page
// into user/mechanic/admin sees one continuous product.
//
// What differs here is only the palette: the landing surface is the graphite
// canvas with a warm amber accent, and each role can tint the mark with its
// own accent while it is being selected.
//
// Motion lives in globals.css (`.brand-loader*`), which also handles
// prefers-reduced-motion.
// ──────────────────────────────────────────────
import React from 'react';
import { palette } from '@automate/shared-brand';

export interface BrandLoaderProps {
  /** Pixel size of the mark. Detail is dropped below 28px to stay legible. */
  size?: number;
  /** Tint the whole mark in one colour — a role accent, or a button's text colour. */
  accent?: string;
  /** Paints the mark in the current text colour — for use inside a button. */
  monochrome?: boolean;
  className?: string;
}

export function BrandLoader({ size = 40, accent, monochrome = false, className }: BrandLoaderProps) {
  // Unique per instance: two loaders on one page must not share a gradient id.
  const gid = React.useId().replace(/:/g, '');
  const detailed = size >= 28;

  const c1 = accent ?? palette.amberSoft;
  const c2 = accent ?? palette.amber;
  const c3 = accent ?? palette.copper;

  const stroke = monochrome ? 'currentColor' : `url(#${gid})`;
  const track = monochrome ? 'currentColor' : c1;

  return (
    <span
      className={['brand-loader', className].filter(Boolean).join(' ')}
      style={
        {
          width: size,
          height: size,
          // The halo and core read these, so a role accent recolours the whole mark.
          '--loader-1': c1,
          '--loader-2': c2,
          '--loader-3': c3,
        } as React.CSSProperties
      }
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
              <stop offset="0%" stopColor={c1} />
              <stop offset="50%" stopColor={c2} />
              <stop offset="100%" stopColor={c3} />
            </linearGradient>
          </defs>
        )}

        {/* Faint full ring, so the sweep reads as travelling along a track. */}
        <circle cx="24" cy="24" r="19" stroke={track} strokeOpacity="0.16" strokeWidth="3.5" />

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

/** Mark + label, for use inside a panel or section rather than over the page. */
export function InlineLoader({
  label = 'Loading…',
  size = 40,
  accent,
  className,
}: {
  label?: string;
  size?: number;
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={['flex flex-col items-center justify-center gap-3 py-12', className]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
    >
      <BrandLoader size={size} accent={accent} />
      <span className="text-sm font-medium text-white/60">{label}</span>
    </div>
  );
}

/** The indeterminate top bar, shown alongside the overlay for slow hand-offs. */
export function BrandLoaderBar({ accent }: { accent?: string }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden"
      aria-hidden
    >
      <div
        className="brand-loader-bar h-full w-1/3 rounded-full"
        style={
          accent
            ? ({ '--loader-1': accent, '--loader-2': accent, '--loader-3': accent } as React.CSSProperties)
            : undefined
        }
      />
    </div>
  );
}

export default BrandLoader;
