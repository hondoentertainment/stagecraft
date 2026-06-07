import { useEffect } from 'react'

interface ShortcutHandlers {
  onSave?: () => void
  onPrint?: () => void
  onCopy?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return

      if (e.key === 's') {
        e.preventDefault()
        handlers.onSave?.()
      } else if (e.key === 'p') {
        e.preventDefault()
        handlers.onPrint?.()
      } else if (e.key === 'c' && (e.shiftKey)) {
        e.preventDefault()
        handlers.onCopy?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers])
}
