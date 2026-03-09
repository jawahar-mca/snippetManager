import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Syne', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        vault: {
          bg:      '#07070e',
          surface: '#0f0f1a',
          card:    '#13131f',
          border:  '#1c1c2e',
          accent:  '#6d28d9',
          bright:  '#8b5cf6',
          muted:   '#2e2e45',
          text:    '#ddddf0',
          dim:     '#7777a0',
          green:   '#10d9a0',
          orange:  '#f97316',
          blue:    '#38bdf8',
          pink:    '#e879f9',
          red:     '#f43f5e',
        },
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                          to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
export default config
