// Génère src/styles/tokens.css à partir de scripts/figma-tokens.json (export des variables Figma).
// Usage : node scripts/build-tokens.mjs. Ne pas éditer tokens.css à la main.
import { readFileSync, writeFileSync } from 'node:fs'

const t = JSON.parse(readFileSync(new URL('./figma-tokens.json', import.meta.url), 'utf8'))
const v = (name) => `--${name.replaceAll('/', '-')}`
const px = (n) => `${n}px`
const lines = []
const block = (selector, decls) => lines.push(`${selector} {`, ...decls.map((d) => `  ${d}`), '}', '')

lines.push('/* Fichier généré par scripts/build-tokens.mjs : ne pas modifier à la main. */', `/* Source : ${t.source} */`, '')

const typeVars = (i) =>
  Object.entries(t.type).flatMap(([k, [, , , d, m]]) => {
    const [size, lh, ls] = i === 0 ? d : m
    return [`--type-${k}-size: ${px(size)};`, `--type-${k}-lh: ${px(lh)};`, `--type-${k}-ls: ${px(ls)};`]
  })

block(':root', [
  ...Object.entries(t.primitives).map(([k, val]) => `${v('p/' + k)}: ${val};`),
  ...t.semantic.map(([k, light]) => `${v(k)}: var(${v('p/' + light)});`),
  ...t.shadcn.map(([k, ref]) => `${v(k)}: var(${v(ref)});`),
  ...Object.entries(t.radius).map(([k, val]) => `--radius-${k}: ${px(val)};`),
  ...Object.entries(t.spacing).map(([k, [d]]) => `${v(k)}: ${px(d)};`),
  ...Object.entries(t.shadows).map(([k, val]) => `--shadow-${k}: ${val};`),
  `--font-display: 'Barlow Condensed', ui-sans-serif, system-ui, sans-serif;`,
  `--font-body: 'DM Sans', ui-sans-serif, system-ui, sans-serif;`,
  ...typeVars(0),
  'color-scheme: light;',
])
block("[data-theme='dark']", [...t.semantic.map(([k, , dark]) => `${v(k)}: var(${v('p/' + dark)});`), 'color-scheme: dark;'])
lines.push('@media (max-width: 767px) {')
block('  :root', [...Object.entries(t.spacing).map(([k, [, m]]) => `${v(k)}: ${px(m)};`), ...typeVars(1)])
lines.push('}', '')

// Classes typographiques (une par style de texte Figma)
lines.push('@layer components {')
for (const [k, [family, weight, upper]] of Object.entries(t.type)) {
  lines.push(
    `  .text-${k} { font-family: var(--font-${family}); font-weight: ${weight}; font-size: var(--type-${k}-size); line-height: var(--type-${k}-lh); letter-spacing: var(--type-${k}-ls);${upper ? ' text-transform: uppercase;' : ''} }`,
  )
}
lines.push('}', '')

writeFileSync(new URL('../src/styles/tokens.css', import.meta.url), lines.join('\n'))
console.log('tokens.css généré')
