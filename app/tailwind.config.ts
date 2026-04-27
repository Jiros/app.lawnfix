import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        lawn: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
      minHeight: {
        tap: '56px', // minimum touch target for wet/dirty hands
      },
      fontSize: {
        // Readable in direct sunlight
        display: ['2rem',   { lineHeight: '2.25rem', fontWeight: '700' }],
        readout: ['1.5rem', { lineHeight: '2rem',    fontWeight: '600' }],
      },
      maxWidth: {
        app: '28rem', // mobile-width container centred on desktop
      },
    },
  },
  plugins: [],
}

export default config
