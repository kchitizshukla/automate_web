/* ──────────────────────────────────────────────
   AutoMate — brand palette (landing / entry surfaces)

   Professional automotive theme: graphite showroom
   canvas, warm amber "workshop light" primary, copper
   and steel as supporting accents. Photography carries
   the mood, so the palette stays restrained — no neon.

   Values are plain hex/rgba strings so the same source
   feeds Tailwind (web) and StyleSheet (React Native).
   ────────────────────────────────────────────── */

export const palette = {
  /** Canvas — graphite, warm rather than blue-black. */
  void: '#0e1113',
  ink: '#14181b',
  surface: '#1b2024',
  surfaceRaised: '#232a2f',

  /** Primary — warm amber, the colour of workshop lighting. */
  amber: '#e0a33e',
  amberSoft: '#f0bd6b',
  amberDeep: '#b57d24',

  /** Secondary — burnt copper. */
  copper: '#c2703f',
  copperSoft: '#d9905f',

  /** Tertiary — brushed steel. */
  steel: '#7d8b99',
  steelSoft: '#a3aeb9',

  /** Text — warm off-white, never pure #fff against graphite. */
  text: '#f4f1ec',
  textMuted: '#a8a49d',
  textFaint: '#75726c',

  /** Glass surfaces + hairlines. */
  glass: 'rgba(255,255,255,0.05)',
  glassStrong: 'rgba(255,255,255,0.085)',
  hairline: 'rgba(255,255,255,0.11)',
  hairlineStrong: 'rgba(255,255,255,0.22)',
} as const;

/** Background gradient stops for the landing canvas (top → bottom). */
export const canvasGradient = ['#0e1113', '#171b1f', '#0e1113'] as const;

export const fonts = {
  /** Body text. Falls back to the platform UI font. */
  sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
  /** Headlines. */
  display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
} as const;

/** Shared motion timings. Interactions stay ≤300ms for perceived snappiness. */
export const motion = {
  fast: 160,
  base: 240,
  slow: 420,
  /** Signature ease-out curve, as cubic-bezier control points. */
  ease: [0.22, 1, 0.36, 1] as const,
} as const;

export type Palette = typeof palette;

/**
 * `#rrggbb` → `rgba(r,g,b,a)`. React Native has no `#rrggbbaa` support on
 * Android, so mobile surfaces must go through this rather than appending
 * a hex alpha suffix.
 */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
