// Dates « calendaires » au format ISO court (AAAA-MM-JJ), sans fuseau : midi local évite les décalages d'heure d'été.

const DAY = 86_400_000
export const parseIso = (iso: string) => new Date(`${iso}T12:00:00`)
/** Jours calendaires entre une date ISO et un instant (0 le jour même, quelle que soit l'heure) */
export const daysBetween = (fromIso: string, to: Date) => Math.round((parseIso(toIso(to)).getTime() - parseIso(fromIso).getTime()) / DAY)
export const addDays = (iso: string, days: number) => toIso(new Date(parseIso(iso).getTime() + days * DAY))
export const toIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
/** « 14 oct. » */
export const formatShortDate = (iso: string) => shortDate.format(parseIso(iso))

const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' })
const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
/** { day: '23', month: 'OCT' } pour les pastilles de date */
export const dateBadge = (iso: string) => ({ day: dayMonth.format(parseIso(iso)), month: monthShort.format(parseIso(iso)).replace('.', '').toUpperCase() })

const monthLong = new Intl.DateTimeFormat('fr-FR', { month: 'long' })
export const monthLabel = (iso: string) => monthLong.format(parseIso(iso)).toUpperCase()

/** Lundi de la semaine qui contient la date */
export function startOfWeek(iso: string) {
  const d = parseIso(iso)
  return addDays(iso, -((d.getDay() + 6) % 7))
}

/** Les 42 jours (6 semaines, du lundi) qui couvrent le mois de la date */
export function monthGrid(iso: string) {
  const first = `${iso.slice(0, 7)}-01`
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

const weekdayShort = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
/** « Lun », « Mar »… */
export const weekdayLabel = (iso: string) => {
  const s = weekdayShort.format(parseIso(iso)).replace('.', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const dayLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
/** « Mardi 20 octobre » */
export const formatDayLong = (iso: string) => {
  const s = dayLong.format(parseIso(iso))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
/** « Octobre 2026 » */
export const formatMonthYear = (iso: string) => {
  const s = monthYear.format(parseIso(iso))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** « 9:00 » → 9 ; « 15:30 » → 15,5 */
export const hourOf = (time: string) => {
  const [h = '0', m = '0'] = time.split(':')
  return Number(h) + Number(m) / 60
}
