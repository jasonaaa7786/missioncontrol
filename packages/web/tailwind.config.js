/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mission': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        'cyber-bg-primary': '#0a0e1a',
        'cyber-bg-secondary': '#0f172a',
        'cyber-bg-tertiary': '#1e293b',
        'cyber-cyan': '#00d9ff',
        'cyber-cyan-dim': '#0891b2',
        'cyber-magenta': '#ff00ff',
        'cyber-purple': '#a855f7',
        'cyber-green': '#00ff88',
        'cyber-yellow': '#ffd700',
        'cyber-red': '#ff3366',
        'cyber-text-primary': '#e2e8f0',
        'cyber-text-secondary': '#94a3b8',
        'cyber-text-dim': '#64748b',
        'cyber-border': 'rgba(0, 217, 255, 0.2)',
        'cyber-border-strong': 'rgba(0, 217, 255, 0.4)',
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
