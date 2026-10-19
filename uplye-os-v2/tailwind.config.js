// Toutes les valeurs viennent des variables CSS générées depuis Figma (src/styles/tokens.css).
const c = (name) => `var(--${name})`
const pair = (name) => ({ DEFAULT: c(name), foreground: c(`${name}-foreground`) })

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', "[data-theme='dark']"],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Niveau shadcn : à utiliser en priorité dans les composants
        background: c('background'),
        foreground: c('foreground'),
        card: pair('card'),
        popover: pair('popover'),
        primary: pair('primary'),
        secondary: pair('secondary'),
        muted: pair('muted'),
        accent: pair('accent'),
        brand: { ...pair('brand'), hover: c('brand-accent-hover'), soft: c('brand-accent-soft') },
        destructive: pair('destructive'),
        border: c('border'),
        input: c('input'),
        ring: c('ring'),
        sidebar: {
          DEFAULT: c('sidebar'),
          foreground: c('sidebar-foreground'),
          primary: c('sidebar-primary'),
          'primary-foreground': c('sidebar-primary-foreground'),
          accent: c('sidebar-accent'),
          'accent-foreground': c('sidebar-accent-foreground'),
          border: c('sidebar-border'),
          ring: c('sidebar-ring'),
          muted: c('shell-muted'),
          field: c('shell-field'),
          hover: c('shell-hover'),
          'tone-2': c('shell-tone-2'),
        },
        // Niveau sémantique : quand shadcn ne suffit pas
        ink: { DEFAULT: c('ink-default'), soft: c('ink-soft'), muted: c('ink-muted'), subtle: c('ink-subtle'), disabled: c('ink-disabled'), inverse: c('ink-inverse') },
        surface: { canvas: c('surface-canvas'), paper: c('surface-paper'), 1: c('surface-tone-1'), 2: c('surface-tone-2'), 3: c('surface-tone-3'), overlay: c('surface-overlay'), hover: c('surface-hover') },
        line: { subtle: c('line-subtle'), strong: c('line-strong'), hairline: c('line-hairline') },
        danger: { DEFAULT: c('danger-default'), hover: c('danger-hover'), tone: c('danger-tone') },
        warning: { DEFAULT: c('warning-default'), tone: c('warning-tone') },
        success: { DEFAULT: c('success-default'), tone: c('success-tone') },
        info: { DEFAULT: c('info-default'), tone: c('info-tone') },
        tag: Object.fromEntries(
          ['neutral', 'yellow', 'orange', 'green', 'blue', 'violet', 'teal', 'red'].map((k) => [k, { bg: c(`tag-${k}-bg`), fg: c(`tag-${k}-fg`) }]),
        ),
        dot: Object.fromEntries(['neutral', 'yellow', 'orange', 'green', 'blue', 'violet', 'teal', 'red'].map((k) => [k, c(`dot-${k}`)])),
        chart: {
          ink: c('chart-ink'), highlight: c('chart-highlight'), muted: c('chart-muted'), grid: c('chart-grid'), axis: c('chart-axis'), track: c('chart-track'),
          1: c('chart-series-1'), 2: c('chart-series-2'), 3: c('chart-series-3'), 4: c('chart-series-4'), 5: c('chart-series-5'), 6: c('chart-series-6'), 7: c('chart-series-7'), 8: c('chart-series-8'),
          studio: c('chart-activity-studio'), azurpod: c('chart-activity-azurpod'), academy: c('chart-activity-academy'),
        },
      },
      borderRadius: {
        xs: c('radius-xs'), sm: c('radius-sm'), md: c('radius-md'), lg: c('radius-lg'), xl: c('radius-xl'), '2xl': c('radius-2xl'), full: c('radius-full'),
      },
      boxShadow: { xs: c('shadow-xs'), sm: c('shadow-sm'), md: c('shadow-md'), lg: c('shadow-lg'), focus: c('shadow-focus') },
      fontFamily: { display: c('font-display'), body: c('font-body'), sans: c('font-body') },
      spacing: {
        'layout-margin': c('layout-margin'), 'layout-gutter': c('layout-gutter'), 'layout-section': c('layout-section'), 'layout-stack': c('layout-stack'),
        sidebar: c('layout-sidebar'), 'control-sm': c('layout-control-sm'), 'control-md': c('layout-control-md'), 'control-lg': c('layout-control-lg'),
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'zoom-in': { from: { opacity: '0', transform: 'translate(-50%, -48%) scale(.97)' }, to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' } },
        'pop-in': { from: { opacity: '0', transform: 'scale(.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'sheet-in': { from: { opacity: '0', transform: 'translateX(24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        confetti: {
          '0%': { opacity: '1', transform: 'translate(0, 0) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translate(var(--confetti-x), var(--confetti-y)) rotate(var(--confetti-r))' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out', 'zoom-in': 'zoom-in 150ms ease-out', 'pop-in': 'pop-in 120ms ease-out', shimmer: 'shimmer 1.6s infinite',
        'sheet-in': 'sheet-in 180ms ease-out', confetti: 'confetti 1.4s cubic-bezier(.2,.6,.4,1) forwards',
      },
    },
  },
  plugins: [],
}
