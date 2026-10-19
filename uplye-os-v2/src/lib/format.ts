const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

/** 1860 → « 1 860 € ». Espace insécable classique : l'espace fine (U+202F) manque dans les polices du Figma. */
export const formatEur = (value: number) => eur.format(value).replace(/\u202f/g, '\u00a0')

/** Accord simple : pluralize(2, 'chose') → « 2 choses ». */
export const pluralize = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count > 1 ? plural : singular}`

const longDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

/** « Dimanche 18 octobre » */
export const formatLongDate = (date: Date) => {
  const s = longDate.format(date)
  return s.charAt(0).toUpperCase() + s.slice(1)
}
