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
        // Base surfaces — deep navy control-room, layered elevation
        bg:      '#080d16',
        card:    '#0e1622',
        card2:   '#13202f',
        card3:   '#0a1119',
        border:  '#22314a',
        borderHi:'#3b526d',
        // Text
        tx:      '#f1f5f9',
        muted:   '#8b9cb8',
        faint:   '#5b6b85',
        // Brand / interaction — solid professional blue, no gradients
        accent:  '#2563eb',
        accent2: '#22d3ee',
        // Status
        danger:  '#fb4360',
        critical:'#a855f7',
        warning: '#f59e0b',
        safe:    '#22c55e',
        info:    '#38bdf8',
        unknown: '#64748b',
        // Status bg (low opacity — use bg-danger/10 etc.)
      },
      backgroundOpacity: {
        12: '0.12',
        15: '0.15',
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px -12px rgba(0,0,0,0.55)',
        glow: '0 0 0 1px rgba(129,140,248,0.25), 0 0 24px -4px rgba(129,140,248,0.45)',
        'glow-safe': '0 0 0 1px rgba(34,197,94,0.25), 0 0 20px -4px rgba(34,197,94,0.45)',
        'glow-danger': '0 0 0 1px rgba(251,67,96,0.3), 0 0 24px -4px rgba(251,67,96,0.55)',
      },
      backgroundImage: {
        'grid-faint': 'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
    },
  },
  plugins: [],
}
