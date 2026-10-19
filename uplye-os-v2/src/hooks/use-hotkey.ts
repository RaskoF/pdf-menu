import { useEffect } from 'react'

/** Raccourci ⌘/Ctrl + touche. Ignoré pendant la saisie dans un champ. */
export function useHotkey(key: string, handler: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== key.toLowerCase()) return
      e.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, handler])
}
