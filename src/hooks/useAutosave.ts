import { useEffect, useRef } from 'react'
import type { FormatSettings, TypeOverrides } from '../types/script'
import { saveDraft } from '../lib/storage'

export function useAutosave(
  rawScript: string,
  settings: FormatSettings,
  typeOverrides: TypeOverrides,
  debounceMs = 1500,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveDraft(rawScript, settings, typeOverrides)
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [rawScript, settings, typeOverrides, debounceMs])
}
