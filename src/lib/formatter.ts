import type { FormatSettings, FormattedScript, ScriptElement } from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'
import { mergeDialogueLines, parseScript } from './parser'

const ROMAN: Record<string, string> = {
  '1': 'I',
  '2': 'II',
  '3': 'III',
  '4': 'IV',
  '5': 'V',
  '6': 'VI',
  '7': 'VII',
  '8': 'VIII',
  '9': 'IX',
  '10': 'X',
  ONE: 'I',
  TWO: 'II',
  THREE: 'III',
  FOUR: 'IV',
  FIVE: 'V',
  SIX: 'VI',
  SEVEN: 'VII',
  EIGHT: 'VIII',
  NINE: 'IX',
  TEN: 'X',
}

const WORDS: Record<string, string> = {
  '1': 'ONE',
  '2': 'TWO',
  '3': 'THREE',
  '4': 'FOUR',
  '5': 'FIVE',
  '6': 'SIX',
  '7': 'SEVEN',
  '8': 'EIGHT',
  '9': 'NINE',
  '10': 'TEN',
  I: 'ONE',
  II: 'TWO',
  III: 'THREE',
  IV: 'FOUR',
  V: 'FIVE',
  VI: 'SIX',
  VII: 'SEVEN',
  VIII: 'EIGHT',
  IX: 'NINE',
  X: 'TEN',
}

function pad(ch: string, inches: number): string {
  const cols = Math.round(inches * 10)
  return ch.repeat(Math.max(0, cols))
}

function formatNumber(num: string, style: FormatSettings['actSceneStyle']): string {
  const upper = num.toUpperCase()
  if (style === 'roman') return ROMAN[upper] ?? upper
  if (style === 'words') return WORDS[upper] ?? upper
  return upper.replace(/[^0-9]/g, '') || upper
}

function formatStageDirection(text: string, style: FormatSettings['stageDirectionStyle']): string {
  if (style === 'parentheses') return `(${text})`
  return text
}

function buildTitlePage(settings: FormatSettings): string[] {
  const { titlePage } = settings
  const lines: string[] = ['', '', '', '', '']
  lines.push(pad(' ', 25) + titlePage.title.toUpperCase())
  if (titlePage.subtitle) {
    lines.push('')
    lines.push(pad(' ', 20) + titlePage.subtitle)
  }
  lines.push('')
  lines.push('')
  if (titlePage.author) {
    lines.push(pad(' ', 28) + `by ${titlePage.author}`)
  }
  if (titlePage.contact) {
    lines.push('')
    lines.push('')
    lines.push('')
    lines.push(pad(' ', 15) + titlePage.contact)
  }
  lines.push('', '', '', '', '')
  return lines
}

function formatElement(el: ScriptElement, settings: FormatSettings): string[] {
  const ci = settings.characterIndent
  const di = settings.dialogueIndent
  const pi = settings.parentheticalIndent

  switch (el.type) {
    case 'blank':
      return ['']
    case 'title':
      return ['', pad(' ', 20) + el.text.toUpperCase(), '']
    case 'subtitle':
      return [pad(' ', 18) + el.text, '']
    case 'author':
      return [pad(' ', 26) + `by ${el.text}`, '']
    case 'act':
      return [
        '',
        pad(' ', 28) + `ACT ${formatNumber(el.text, settings.actSceneStyle)}`,
        '',
      ]
    case 'scene':
      return [
        '',
        pad(' ', 26) + `SCENE ${formatNumber(el.text, settings.actSceneStyle)}`,
        '',
      ]
    case 'setting':
      return [
        formatStageDirection(el.text, settings.stageDirectionStyle),
        '',
      ]
    case 'character':
      return [
        pad(' ', ci) + el.text.toUpperCase(),
        ...(settings.doubleSpaceAfterCharacter ? [''] : []),
      ]
    case 'parenthetical':
      return [pad(' ', pi) + `(${el.text})`]
    case 'dialogue':
      return el.text.split('\n').map((line) => pad(' ', di) + line)
    case 'stage_direction':
      return [
        formatStageDirection(el.text, settings.stageDirectionStyle),
        '',
      ]
    case 'transition':
      return ['', pad(' ', 35) + el.text.toUpperCase(), '']
    default:
      return [el.text]
  }
}

function extractTitlePageInfo(elements: ScriptElement[]): {
  title: string
  subtitle: string
  author: string
} {
  let title = ''
  let subtitle = ''
  let author = ''

  for (const el of elements) {
    if (el.type === 'title' && !title) title = el.text
    if (el.type === 'subtitle' && !subtitle) subtitle = el.text
    if (el.type === 'author' && !author) author = el.text
    if (el.type === 'act' || el.type === 'scene') break
  }

  return { title, subtitle, author }
}

function collectWarnings(elements: ScriptElement[]): string[] {
  const warnings: string[] = []
  let hasCharacter = false
  let hasDialogue = false
  let orphanDialogue = 0

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    if (el.type === 'character') hasCharacter = true
    if (el.type === 'dialogue') {
      hasDialogue = true
      const prev = elements
        .slice(0, i)
        .reverse()
        .find((e) => e.type !== 'blank')
      if (prev?.type !== 'character' && prev?.type !== 'parenthetical') {
        orphanDialogue++
      }
    }
  }

  if (!hasCharacter && hasDialogue) {
    warnings.push('Dialogue found without character names — check ALL CAPS formatting.')
  }
  if (orphanDialogue > 0) {
    warnings.push(
      `${orphanDialogue} dialogue block(s) may be missing a character cue above them.`,
    )
  }
  if (!elements.some((e) => e.type === 'act' || e.type === 'scene')) {
    warnings.push('No act or scene headings detected — consider adding ACT/SCENE markers.')
  }

  return warnings
}

export function formatScript(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): FormattedScript {
  const parsed = mergeDialogueLines(parseScript(raw))
  const extracted = extractTitlePageInfo(parsed)

  const mergedSettings: FormatSettings = {
    ...settings,
    titlePage: {
      ...settings.titlePage,
      title: settings.titlePage.title || extracted.title || 'Untitled Play',
      subtitle: settings.titlePage.subtitle || extracted.subtitle,
      author: settings.titlePage.author || extracted.author,
    },
  }

  const bodyStart = parsed.findIndex(
    (e) => e.type === 'act' || e.type === 'scene',
  )
  const bodyElements =
    bodyStart >= 0 ? parsed.slice(bodyStart) : parsed.filter(
      (e) => !['title', 'subtitle', 'author'].includes(e.type),
    )

  const outputLines: string[] = []

  if (mergedSettings.showTitlePage) {
    outputLines.push(...buildTitlePage(mergedSettings))
    outputLines.push('', '—'.repeat(40), '')
  }

  for (const el of bodyElements) {
    outputLines.push(...formatElement(el, mergedSettings))
  }

  return {
    elements: parsed,
    plainText: outputLines.join('\n').replace(/\n{4,}/g, '\n\n\n'),
    warnings: collectWarnings(parsed),
  }
}

export function formatScriptToHtml(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): string {
  const { elements } = formatScript(raw, settings)
  const extracted = extractTitlePageInfo(elements)
  const mergedSettings: FormatSettings = {
    ...settings,
    titlePage: {
      ...settings.titlePage,
      title: settings.titlePage.title || extracted.title || 'Untitled Play',
      subtitle: settings.titlePage.subtitle || extracted.subtitle,
      author: settings.titlePage.author || extracted.author,
    },
  }

  const bodyStart = elements.findIndex(
    (e) => e.type === 'act' || e.type === 'scene',
  )
  const bodyElements =
    bodyStart >= 0
      ? elements.slice(bodyStart)
      : elements.filter((e) => !['title', 'subtitle', 'author'].includes(e.type))

  const parts: string[] = []

  if (mergedSettings.showTitlePage) {
    parts.push('<div class="title-page">')
    parts.push(`<h1>${escapeHtml(mergedSettings.titlePage.title.toUpperCase())}</h1>`)
    if (mergedSettings.titlePage.subtitle) {
      parts.push(`<p class="subtitle">${escapeHtml(mergedSettings.titlePage.subtitle)}</p>`)
    }
    if (mergedSettings.titlePage.author) {
      parts.push(`<p class="author">by ${escapeHtml(mergedSettings.titlePage.author)}</p>`)
    }
    if (mergedSettings.titlePage.contact) {
      parts.push(`<p class="contact">${escapeHtml(mergedSettings.titlePage.contact)}</p>`)
    }
    parts.push('</div><div class="page-break"></div>')
  }

  parts.push('<div class="script-body">')

  for (const el of bodyElements) {
    switch (el.type) {
      case 'blank':
        parts.push('<div class="spacer"></div>')
        break
      case 'act':
        parts.push(
          `<p class="act">ACT ${escapeHtml(formatNumber(el.text, mergedSettings.actSceneStyle))}</p>`,
        )
        break
      case 'scene':
        parts.push(
          `<p class="scene">SCENE ${escapeHtml(formatNumber(el.text, mergedSettings.actSceneStyle))}</p>`,
        )
        break
      case 'setting':
        parts.push(
          `<p class="setting">${escapeHtml(formatStageDirection(el.text, mergedSettings.stageDirectionStyle))}</p>`,
        )
        break
      case 'character':
        parts.push(`<p class="character">${escapeHtml(el.text.toUpperCase())}</p>`)
        break
      case 'parenthetical':
        parts.push(`<p class="parenthetical">(${escapeHtml(el.text)})</p>`)
        break
      case 'dialogue':
        for (const line of el.text.split('\n')) {
          parts.push(`<p class="dialogue">${escapeHtml(line)}</p>`)
        }
        break
      case 'stage_direction':
        parts.push(
          `<p class="direction">${escapeHtml(formatStageDirection(el.text, mergedSettings.stageDirectionStyle))}</p>`,
        )
        break
      case 'transition':
        parts.push(`<p class="transition">${escapeHtml(el.text.toUpperCase())}</p>`)
        break
      default:
        break
    }
  }

  parts.push('</div>')
  return parts.join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
