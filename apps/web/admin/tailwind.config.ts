import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#f59e0b', // amber-500 — Aurora accent (admin)
          50: '#fffbeb',
          600: '#d97706',
          700: '#b45309',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -12px rgba(15,23,42,0.12)',
        glow: '0 8px 24px -6px rgba(245,158,11,0.45)',
      },
    },
  },
  // statusColor() returns 'green' | 'blue' | 'amber' | 'red' | 'gray'.
  safelist: [
    'bg-green-100', 'text-green-700', 'bg-green-50', 'text-green-600',
    'bg-blue-100', 'text-blue-700', 'bg-blue-50', 'text-blue-600',
    'bg-amber-100', 'text-amber-700', 'bg-amber-50', 'text-amber-600',
    'bg-red-100', 'text-red-700', 'bg-red-50', 'text-red-600',
    'bg-gray-100', 'text-gray-700', 'bg-gray-50', 'text-gray-600',
  ],
  plugins: [],
};

export default config;
