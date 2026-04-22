/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: {
          base: '#F9F9FB',      // off-white background
          surface: '#FFFFFF',   // cards/panels
          elevated: '#F3F4F8',  // subtle elevation
          border: '#E6E7EE',    // separators
        },
        accent: {
          // Brand
          green: '#6D28D9', // purple (keeps existing classnames working)
          'green-dim': '#6D28D920',
          yellow: '#FBBF24',
          'yellow-dim': '#FBBF2420',

          // Status/semantic
          red: '#ff4d6d',
          'red-dim': '#ff4d6d20',
          amber: '#f59e0b',
          blue: '#3b82f6',
        },
        text: {
          primary: '#14151A',
          secondary: '#4B4E5A',
          muted: '#8A8F9D',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
