// Lecture d'un export CSV de contacts (séparateur virgule ou point-virgule, guillemets possibles).
// Colonnes reconnues (insensible à la casse et aux accents) : nom, contact, ville, secteur, email.

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

function splitLine(line: string, sep: string) {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"'
        i++
      } else quoted = !quoted
    } else if (ch === sep && !quoted) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}

export interface ImportedClient {
  name: string
  contactName: string
  city: string
  sector: string
  email: string
}

export function parseClientsCsv(text: string): { rows: ImportedClient[]; skipped: number } {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim())
  if (lines.length < 2) return { rows: [], skipped: 0 }
  const sep = (lines[0]!.match(/;/g)?.length ?? 0) > (lines[0]!.match(/,/g)?.length ?? 0) ? ';' : ','
  const header = splitLine(lines[0]!, sep).map(normalize)
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h))
  const idx = {
    name: col('nom', 'entreprise', 'societe', 'name', 'company'),
    contact: col('contact', 'interlocuteur'),
    city: col('ville', 'city'),
    sector: col('secteur', 'sector'),
    email: col('email', 'e-mail', 'mail'),
  }
  let skipped = 0
  const rows: ImportedClient[] = []
  for (const line of lines.slice(1)) {
    const cells = splitLine(line, sep)
    const name = idx.name >= 0 ? (cells[idx.name] ?? '') : ''
    if (!name) {
      skipped++
      continue
    }
    rows.push({
      name: name.slice(0, 120),
      contactName: (idx.contact >= 0 ? cells[idx.contact] : '')?.slice(0, 120) || name.slice(0, 120),
      city: (idx.city >= 0 ? cells[idx.city] : '')?.slice(0, 80) ?? '',
      sector: (idx.sector >= 0 ? cells[idx.sector] : '')?.slice(0, 80) || 'À préciser',
      email: (idx.email >= 0 ? cells[idx.email] : '')?.slice(0, 160) ?? '',
    })
  }
  return { rows, skipped }
}
