/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#f5f4ec', surface: '#fffbf4', side: '#101400', hover: '#e0dfce',
        ink: '#101400', ink2: '#595849', ondark: '#fffbf4', ondarkm: '#b8b79e',
        line: '#e0dfce', line2: '#b8b79e', accent: '#ffff05', col: '#e7e6d8',
        g1: '#dcefd9', g7: '#2e6b2a', r1: '#f8dad3', r7: '#a3341f', b1: '#dce9f5', b7: '#2b5c8a',
        o1: '#fbe3cc', o7: '#9a4b0e', p1: '#e6ddf5', p7: '#5b3e96', t1: '#d3efec', t7: '#1f6b65', y1: '#ffffc2',
      },
      fontFamily: {
        title: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
