import type { Config } from 'tailwindcss';
import { palette } from '@automate/shared-brand';

/* Tailwind reads the shared palette from @automate/shared-brand so the tokens
   the native apps rely on stay available here, and extends it with the
   landing surface's own navy/azure scale. The landing page is the one screen
   a visitor meets before picking a lane, so it wears the neutral product
   colour rather than any single role's accent. */

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    // The role/feature copy lives in the shared package; Tailwind must scan
    // it too or class names referenced from there would be purged.
    '../../../packages/shared-brand/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Landing surface ── */
        navy: {
          DEFAULT: '#0A1628', // page canvas
          deep: '#050C18',    // hero floor
          ink: '#0C1B2E',     // section canvas
          surface: '#112438', // cards, tiles
          raised: '#17304A',  // hover / medallions
        },
        azure: {
          DEFAULT: '#2B8FFF',
          soft: '#5EA9FF',
          deep: '#1668D8',
          glow: '#4DA3FF',
        },
        /* ── Shared tokens, kept so the hand-off screens keep compiling ── */
        graphite: {
          DEFAULT: palette.void,
          ink: palette.ink,
          surface: palette.surface,
          raised: palette.surfaceRaised,
        },
        amber: {
          DEFAULT: palette.amber,
          soft: palette.amberSoft,
          deep: palette.amberDeep,
        },
        copper: {
          DEFAULT: palette.copper,
          soft: palette.copperSoft,
        },
        steel: {
          DEFAULT: palette.steel,
          soft: palette.steelSoft,
        },
        bone: '#F3F7FC',
        mist: '#94A8C0', // muted body copy on navy
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem', '4xl': '2rem' },
      boxShadow: {
        plate: '0 18px 48px -20px rgba(2, 8, 20, 0.9)',
        lift: '0 30px 70px -28px rgba(2, 8, 20, 0.95)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        // Soft azure bloom under the primary call to action.
        azure: '0 14px 34px -12px rgba(43, 143, 255, 0.55)',
      },
      letterSpacing: { widest: '0.22em' },
      keyframes: {
        // Very slow zoom on hero photography (Ken Burns).
        pan: {
          '0%, 100%': { transform: 'scale(1.06) translate3d(0,0,0)' },
          '50%': { transform: 'scale(1.14) translate3d(0,-1.5%,0)' },
        },
      },
      animation: {
        pan: 'pan 28s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
