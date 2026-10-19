import { devisAmount } from '../lib'
import type { DecidedDeal, Devis, Brand, MemberId } from '../types'
import { CLIENT_SOURCES, LOSS_REASONS, WIN_REASONS } from '../reasons'
import { daysBetween } from '../lib'

// Calculs de l'onglet Analyse : devis décidés du pipeline + historique, filtrés.

export interface AnalysisFilters {
  owner: MemberId | 'all'
  brand: Brand | 'all'
  periodDays: number
}

export function decidedDeals(devis: Devis[], history: DecidedDeal[], clientName: (id: string) => string): DecidedDeal[] {
  const fromPipeline = devis
    .filter((d) => (d.status === 'signe' || d.status === 'refuse') && d.decidedAt)
    .map<DecidedDeal>((d) => ({
      id: d.id,
      client: clientName(d.clientId),
      amount: devisAmount(d) ?? 0,
      outcome: d.status === 'signe' ? 'gagne' : 'perdu',
      decidedAt: d.decidedAt!,
      owner: d.owner,
      brand: d.brand,
      source: d.win?.source ?? d.source ?? 'Prospection',
      win: d.win,
      loss: d.loss,
    }))
  return [...fromPipeline, ...history].sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
}

const countBy = (labels: readonly string[], values: string[]) =>
  labels
    .map((label) => ({ label, value: values.filter((v) => v === label).length }))
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value)

const rate = (won: number, total: number) => (total ? won / total : 0)
const pct = (r: number) => `${Math.round(r * 100)} %`

export function analyse(all: DecidedDeal[], filters: AnalysisFilters, now: Date) {
  const deals = all.filter(
    (d) =>
      (filters.owner === 'all' || d.owner === filters.owner) &&
      (filters.brand === 'all' || d.brand === filters.brand) &&
      daysBetween(d.decidedAt, now) <= filters.periodDays,
  )
  const won = deals.filter((d) => d.outcome === 'gagne')
  const lost = deals.filter((d) => d.outcome === 'perdu')
  const avg = (list: DecidedDeal[]) => (list.length ? Math.round(list.reduce((s, d) => s + d.amount, 0) / list.length) : 0)

  const winReasons = countBy(
    WIN_REASONS,
    won.flatMap((d) => d.win?.reasons ?? []),
  )
  const lossReasons = countBy(
    LOSS_REASONS.map((r) => r.label),
    lost.flatMap((d) => (d.loss ? [d.loss.reason] : [])),
  )

  const bySource = CLIENT_SOURCES.map((source) => {
    const list = deals.filter((d) => d.source === source)
    const w = list.filter((d) => d.outcome === 'gagne').length
    return { label: source, won: w, total: list.length, rate: rate(w, list.length) }
  })
    .filter((s) => s.total > 0)
    .sort((a, b) => b.rate - a.rate)

  const brackets = [
    { label: 'Moins de 1 000 €', test: (a: number) => a < 1000 },
    { label: '1 000 à 3 000 €', test: (a: number) => a >= 1000 && a <= 3000 },
    { label: 'Plus de 3 000 €', test: (a: number) => a > 3000 },
  ].map(({ label, test }) => {
    const list = deals.filter((d) => test(d.amount))
    const w = list.filter((d) => d.outcome === 'gagne').length
    return { label, won: w, total: list.length, rate: rate(w, list.length) }
  })

  const insights: string[] = []
  const big = brackets[2]!
  if (big.total > 0 && big.won < big.total) {
    const bigLostOnPrice = lost.filter((d) => d.amount > 3000 && d.loss?.reason === 'Trop cher').length
    insights.push(
      `Au-dessus de 3 000 €, ${big.total - big.won} devis sur ${big.total} sont perdus${bigLostOnPrice ? ', souvent sur le prix : proposer le paiement en 3 fois sur ces devis' : ''}.`,
    )
  }
  if (winReasons[0])
    insights.push(`« ${winReasons[0].label} » revient dans ${winReasons[0].value} signatures sur ${won.length} : à mettre en avant dans chaque proposition.`)
  if (bySource[0] && bySource[0].total > 1)
    insights.push(`Les clients venus par « ${bySource[0].label} » signent à ${pct(bySource[0].rate)} : demander un avis et un contact à chaque projet livré.`)

  return {
    deals,
    won,
    lost,
    signatureRate: rate(won.length, deals.length),
    avgWon: avg(won),
    avgLost: avg(lost),
    winReasons,
    lossReasons,
    bySource,
    brackets,
    insights,
    pct,
  }
}
