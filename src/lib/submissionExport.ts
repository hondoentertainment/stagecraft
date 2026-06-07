import JSZip from 'jszip'
import type { FormatSettings } from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'
import { formatScript } from './formatter'
import { buildScriptPdf } from './pdfExport'
import {
  formatCharacterListReport,
  formatSceneBreakdownReport,
  generateScriptReport,
} from './reports'
import { downloadBlob, sanitizeFilename } from './export'

export async function buildSubmissionPackage(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): Promise<Blob> {
  const zip = new JSZip()
  const name = sanitizeFilename(settings.titlePage.title || 'play-script')
  const formatted = formatScript(raw, settings)
  const report = generateScriptReport(formatted.elements, settings)

  zip.file(`${name}.txt`, formatted.plainText)

  const pdf = await buildScriptPdf(raw, settings)
  zip.file(`${name}.pdf`, pdf)

  zip.file('cast-of-characters.txt', formatCharacterListReport(report))
  zip.file('scene-breakdown.txt', formatSceneBreakdownReport(report))

  if (settings.synopsis.trim()) {
    zip.file('synopsis.txt', settings.synopsis.trim())
  }

  zip.file('README.txt', [
    'SUBMISSION PACKAGE',
    '==================',
    '',
    `Title: ${settings.titlePage.title}`,
    `Author: ${settings.titlePage.author || '—'}`,
    `Pages: ${report.pageCount}`,
    `Estimated runtime: ~${report.runtimeMinutes} minutes`,
    '',
    'Contents:',
    `  ${name}.pdf       — Formatted script (PDF)`,
    `  ${name}.txt       — Formatted script (plain text)`,
    '  cast-of-characters.txt',
    '  scene-breakdown.txt',
    settings.synopsis.trim() ? '  synopsis.txt' : '',
  ]
    .filter(Boolean)
    .join('\n'))

  return zip.generateAsync({ type: 'blob' })
}

export async function downloadSubmissionPackage(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): Promise<void> {
  const blob = await buildSubmissionPackage(raw, settings)
  const name = sanitizeFilename(settings.titlePage.title || 'play-script')
  downloadBlob(blob, `${name}-submission.zip`, 'application/zip')
}
