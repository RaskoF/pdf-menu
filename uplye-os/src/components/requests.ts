import type { Notification, Person, Task } from '../types'
import { PEOPLE, fmtDate, uid } from '../utils'

// Champs « sensibles » : pour un membre Production, ils passent par une validation admin.
export function sensitiveDiff(before: Task, after: Task) {
  const d: { due?: string; hours?: number; assignee?: Person } = {}
  if (before.due.slice(0, 10) !== after.due.slice(0, 10)) d.due = after.due
  if (before.hours !== after.hours) d.hours = after.hours
  if (before.assignee !== after.assignee) d.assignee = after.assignee
  return Object.keys(d).length ? d : null
}

export function describe(t: Task, d: { due?: string; hours?: number; assignee?: Person }) {
  const parts: string[] = []
  if (d.due) parts.push(`échéance ${fmtDate(t.due)} → ${fmtDate(d.due)}`)
  if (d.hours !== undefined) parts.push(`durée ${t.hours} h → ${d.hours} h`)
  if (d.assignee) parts.push(`réassignée à ${PEOPLE[d.assignee].name}`)
  return parts.join(', ')
}

export const notif = (to: Notification['to'], text: string, link: string, kind: Notification['kind'] = 'info'): Notification =>
  ({ id: uid(), at: new Date().toISOString(), to, text, link, read: false, kind })
