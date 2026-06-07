import type { FormatSettings } from '../types/script'

export function downloadBlob(
  content: Blob,
  filename: string,
  mimeType?: string,
): void {
  const blob =
    mimeType && content.type !== mimeType
      ? new Blob([content], { type: mimeType })
      : content
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function sanitizeFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'play-script'
  )
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function printScript(settings: FormatSettings): void {
  document.documentElement.style.setProperty(
    '--script-font-size',
    `${settings.fontSize}pt`,
  )
  window.print()
}
