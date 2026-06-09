import { useEffect, useRef, useState } from 'react'
import type { CastMetadata, FormatSettings, TypeOverrides } from '../types/script'
import { saveDraft } from '../lib/storage'

export type AutosaveStatus = 'idle' | 'pending' | 'saved'

export function useAutosave(
  rawScript: string,
  settings: FormatSettings,
  typeOverrides: TypeOverrides,
  castMetadata: CastMetadata,
  debounceMs = 1500,
): AutosaveStatus {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatus] = useState<AutosaveStatus>('idle')

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (flashRef.current) clearTimeout(flashRef.current)

    const pendingTimer = window.setTimeout(() => setStatus('pending'), 0)

    timerRef.current = setTimeout(() => {
      saveDraft(rawScript, settings, typeOverrides, castMetadata)
      setStatus('saved')
      flashRef.current = setTimeout(() => setStatus('idle'), 2000)
    }, debounceMs)

    return () => {
      clearTimeout(pendingTimer)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [rawScript, settings, typeOverrides, castMetadata, debounceMs])

  return status
}
