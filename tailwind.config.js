/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        mono:  ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        // Base
        bg:      '#060b14',
        card:    '#0d1520',
        card2:   '#111d2b',
        border:  '#1a2a3a',
        borderHi:'#243447',
        // Text
        tx:      '#dde6f0',
        muted:   '#4a6070',
        // Status
        danger:  '#f43f5e',
        warning: '#fb923c',
        safe:    '#34d399',
        info:    '#38bdf8',
        accent:  '#818cf8',
        // Status bg (low opacity — use bg-danger/10 etc.)
      },
      backgroundOpacity: {
        12: '0.12',
        15: '0.15',
      },
    },
  },
  plugins: [],
}
