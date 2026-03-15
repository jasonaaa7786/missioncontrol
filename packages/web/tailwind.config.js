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
        // Clean neutral dark palette — replaces cyberpunk
        'cyber-bg-primary':    '#111111',
        'cyber-bg-secondary':  '#161616',
        'cyber-bg-tertiary':   '#1f1f1f',
        'cyber-cyan':          '#6366f1',   // indigo accent
        'cyber-cyan-dim':      '#4f46e5',   // indigo darker
        'cyber-magenta':       '#9b6dff',   // soft purple
        'cyber-purple':        '#7c5cdb',
        'cyber-green':         '#22c55e',   // clean green
        'cyber-yellow':        '#f59e0b',   // amber
        'cyber-red':           '#ef4444',   // clean red
        'cyber-text-primary':  '#f0f0f0',
        'cyber-text-secondary':'#a0a0a0',
        'cyber-text-dim':      '#6b7280',
        'cyber-border':        'rgba(255, 255, 255, 0.08)',
        'cyber-border-strong': 'rgba(255, 255, 255, 0.15)',
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
