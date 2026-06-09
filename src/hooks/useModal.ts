import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function useModal<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
): RefObject<T | null> {
  const panelRef = useRef<T>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    if (!panel) return

    const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    panel.addEventListener('keydown', trap)
    return () => panel.removeEventListener('keydown', trap)
  }, [open])

  return panelRef
}
