/* ──────────────────────────────────────────────
   AutoMate landing — photographic backdrop

   A CSS background layer plus a gradient scrim, matching
   the pattern in apps/web/user/app/page.tsx. Using
   `background-image` rather than <img> means a failed
   request leaves the graphite canvas showing instead of
   a broken-image placeholder.
   ────────────────────────────────────────────── */

export function Backdrop({
  src,
  /** `scrim` for full-bleed sections, `scrim-card` for the role cards. */
  variant = 'scrim',
  /** Opacity of the photograph itself, before the scrim. */
  opacity = 0.5,
  /** Slow Ken Burns pan — skip it for small or repeated surfaces. */
  animated = false,
  className = '',
}: {
  src: string;
  variant?: 'scrim' | 'scrim-card';
  opacity?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className={`absolute inset-0 bg-cover bg-center ${animated ? 'animate-pan' : ''}`}
        style={{ backgroundImage: `url('${src}')`, opacity }}
      />
      <div className={`absolute inset-0 ${variant}`} />
    </div>
  );
}
