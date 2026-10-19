import type { Client, ClientStatus } from '../types'

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join('')

let seq = 0
/** Nouveau compte (prospect par défaut) avec les sections vides de la fiche. */
export function newClient(
  input: { name: string; contactName?: string; city?: string; sector?: string; email?: string; phone?: string; status?: ClientStatus },
  today: string,
): Client {
  seq += 1
  const contactName = input.contactName?.trim() || input.name
  return {
    id: `client-${Date.now()}-${seq}`,
    name: input.name.trim(),
    initials: initialsOf(input.name),
    contactName,
    city: input.city?.trim() ?? '',
    sector: input.sector?.trim() || 'À préciser',
    status: input.status ?? 'prospect',
    revenue12m: 0,
    revenueNote: 'nouveau compte',
    lastExchange: { label: 'Compte créé', date: today },
    contacts:
      input.email || input.phone
        ? [
            {
              id: `c-${seq}`,
              name: contactName,
              initials: initialsOf(contactName),
              role: 'Contact principal',
              email: input.email?.trim() ?? '',
              phone: input.phone?.trim() ?? '',
              primary: true,
            },
          ]
        : [],
    pinned: [],
    projects: [],
    invoices: [],
    files: [],
    activity: [],
  }
}
