import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Les styles de texte Figma (.text-h1, .text-body-md…) sont des tailles de police,
// pas des couleurs : on l'apprend à tailwind-merge pour qu'il ne les supprime pas.
const TEXT_STYLES = [
  'display-lg', 'h1', 'h2', 'h3', 'stat-lg', 'stat-md', 'title-md', 'title-sm',
  'body-lg', 'body-md', 'body-sm', 'body-xs', 'label-md', 'label-sm', 'meta-md', 'meta-sm', 'wordmark',
] as const

const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: [...TEXT_STYLES] }] } },
})

/** Assemble des classes Tailwind en résolvant les conflits (dernière classe gagnante). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
