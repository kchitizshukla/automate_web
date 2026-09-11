import type { Config } from 'tailwindcss';
import { palette } from '@automate/shared-brand';

/* Tailwind reads its palette straight from @automate/shared-brand so the
   landing page and the mobile LandingScreen can never drift apart. */

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
        bone: palette.text,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem', '4xl': '2rem' },
      boxShadow: {
        // Deep, neutral shadows — photography supplies the drama, not glow.
        plate: '0 18px 48px -20px rgba(0,0,0,0.85)',
        lift: '0 30px 70px -28px rgba(0,0,0,0.95)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.06)',
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
