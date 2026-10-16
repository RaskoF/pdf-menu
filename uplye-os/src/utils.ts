import type { Devis, Line, Schedule, Stage } from './types'

export const TVA = 0.2

export const STAGES: { id: Stage; label: string; dot: string; proba: number }[] = [
  { id: 'a_chiffrer', label: 'À chiffrer', dot: 'bg-ink', proba: 0.1 },
  { id: 'brouillon', label: 'Brouillon', dot: 'bg-ink2', proba: 0.2 },
  { id: 'envoye', label: 'Envoyé', dot: 'bg-ink', proba: 0.4 },
  { id: 'ouvert', label: 'Ouvert', dot: 'bg-b7', proba: 0.6 },
  { id: 'signe', label: 'Signé', dot: 'bg-g7', proba: 1 },
  { id: 'refuse', label: 'Refusé', dot: 'bg-r7', proba: 0 },
]
export const stageOf = (s: Stage) => STAGES.find((x) => x.id === s)!

export const lineTotal = (l: Line) => (l.offered ? 0 : Math.max(0, l.qty * l.unitPrice - l.discount))
export const totalHT = (d: Devis) => d.lines.reduce((s, l) => s + lineTotal(l), 0)
export const grossHT = (d: Devis) => d.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)

export const scheduleParts = (s: Schedule): { pct: number; label: string }[] =>
  s === '40/30/30'
    ? [{ pct: 40, label: 'À la signature' }, { pct: 30, label: 'À la livraison' }, { pct: 30, label: '30 jours après' }]
    : s === '50/50'
      ? [{ pct: 50, label: 'À la signature' }, { pct: 50, label: 'À la livraison' }]
      : [{ pct: 100, label: 'À la signature' }]

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const eur2 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
export const fmt = (n: number) => eur.format(Math.round(n))
export const fmt2 = (n: number) => eur2.format(n)

export const fmtDate = (iso?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', opts) : '—'

export const daysBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
export const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

export const uid = () => Math.random().toString(36).slice(2, 10)
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')

export function relative(iso?: string) {
  if (!iso) return ''
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  return d <= 0 ? "aujourd'hui" : d === 1 ? 'hier' : `il y a ${d} j`
}

export const PEOPLE: Record<'E' | 'A' | 'X', { name: string; role: string; capacity: number }> = {
  E: { name: 'Enzo', role: 'Président · clients', capacity: 35 },
  A: { name: 'Allan', role: 'Direction artistique', capacity: 35 },
  X: { name: 'Alexis', role: 'Montage (alternance)', capacity: 21 },
}
export const HOURLY_COST = 35 // coût interne d'une heure de travail, € HT

export const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString()
export const monthKey = (iso: string) => iso.slice(0, 7)
export const monthLabel = (key: string, opts: Intl.DateTimeFormatOptions = { month: 'short' }) =>
  new Date(key + '-15').toLocaleDateString('fr-FR', opts).replace('.', '')
export function lastMonths(n: number, from = new Date()) {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 15)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

export const FORMULAS: Record<'Standard' | 'Clé en main' | 'Pré-montage', { rate: number; desc: string }> = {
  Standard: { rate: 150, desc: 'Studio + 2 caméras, fichiers bruts' },
  'Pré-montage': { rate: 220, desc: 'Studio + montage multicaméra' },
  'Clé en main': { rate: 300, desc: 'Montage, habillage et 3 extraits verticaux' },
}
export const STUDIO_HOURS = { open: 9, close: 19 } // créneaux réservables
export function weekStart(offset = 0) {
  const d = new Date(); d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7)
  return d
}
export const atHour = (day: Date, h: number) => { const d = new Date(day); d.setHours(Math.floor(h), (h % 1) * 60, 0, 0); return d.toISOString() }

// Rappel d'échéance pour une tâche non terminée
export function dueState(due: string, done: boolean): 'late' | 'today' | 'tomorrow' | null {
  if (done) return null
  const d = new Date(due); const t = new Date(); t.setHours(0, 0, 0, 0)
  const diff = Math.floor((new Date(d.toDateString()).getTime() - t.getTime()) / 86400000)
  return diff < 0 ? 'late' : diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : null
}
export const DUE_LABEL = { late: 'En retard', today: 'Échéance aujourd’hui', tomorrow: 'Échéance demain' } as const
