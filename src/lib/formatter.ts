import type {
  CastMetadata,
  FormatSettings,
  FormattedScript,
  ScriptElement,
  TypeOverrides,
} from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'
import {
  formatCastPageHtml,
  formatCastPagePlain,
  mergeCastWithDetected,
} from './castPage'
import { collectWarnings } from './warnings'
import {
  estimatePageCount,
  estimateRuntimeMinutes,
  paginateElements,
} from './pagination'
import {
  applyTypeOverrides,
  mergeDialogueLines,
  parseScript,
} from './parser'

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

const DUAL_COL_WIDTH = 28

function pad(ch: string, inches: number): string {
  const cols = Math.round(inches * 10)
  return ch.repeat(Math.max(0, cols))
}

export function formatNumber(num: string, style: FormatSettings['actSceneStyle']): string {
  const upper = num.toUpperCase()
  if (style === 'roman') return ROMAN[upper] ?? upper
  if (style === 'words') return WORDS[upper] ?? upper
  return upper.replace(/[^0-9]/g, '') || upper
}

export function formatStageDirection(
  text: string,
  style: FormatSettings['stageDirectionStyle'],
): string {
  const cleaned = text.replace(/^\(|\)\.?$/g, '').trim()
  if (style === 'parentheses') return `(${cleaned})`
  return cleaned
}

function formatLyricsLine(line: string, settings: FormatSettings): string {
  return settings.lyricsStyle === 'uppercase' ? line.toUpperCase() : line
}

function capitalizeNamesInDirection(
  text: string,
  characterNames: string[],
): string {
  let result = text
  for (const name of characterNames) {
    const re = new RegExp(`\\b${name}\\b`, 'gi')
    result = result.replace(re, name)
  }
  return result
}

export function collectCharacterNames(elements: ScriptElement[]): string[] {
  const names = new Set<string>()
  for (const el of elements) {
    if (el.type === 'character') {
      const base = el.text.replace(/\s*\([^)]*\)/g, '').trim().toUpperCase()
      if (base) names.add(base)
    }
  }
  return [...names]
}

function buildTitlePage(settings: FormatSettings): string[] {
  const { titlePage } = settings
  const lines: string[] = ['', '', '', '', '', '', '']
  lines.push(pad(' ', 22) + titlePage.title.toUpperCase())
  if (titlePage.subtitle) {
    lines.push('')
    lines.push(pad(' ', 20) + titlePage.subtitle)
  }
  lines.push('')
  if (titlePage.author) {
    lines.push(pad(' ', 24) + `by ${titlePage.author}`)
  }
  lines.push('', '', '', '')
  if (titlePage.copyright) {
    lines.push(titlePage.copyright)
  }
  if (titlePage.contact) {
    const contactLines = titlePage.contact.split('\n')
    for (const line of contactLines) {
      lines.push(pad(' ', 48) + line)
    }
  }
  lines.push('', '', '')
  return lines
}

function formatDualDialoguePlain(
  leftName: string,
  leftText: string,
  rightName: string,
  rightText: string,
  settings: FormatSettings,
): string[] {
  const indent = pad(' ', settings.dialogueIndent)
  const leftLines = leftText.split('\n')
  const rightLines = rightText.split('\n')
  const rows = Math.max(leftLines.length, rightLines.length)
  const lines: string[] = [
    indent +
      leftName.toUpperCase().padEnd(DUAL_COL_WIDTH) +
      rightName.toUpperCase(),
  ]
  for (let i = 0; i < rows; i++) {
    const l = (leftLines[i] ?? '').slice(0, DUAL_COL_WIDTH - 1)
    const r = (rightLines[i] ?? '').slice(0, DUAL_COL_WIDTH - 1)
    lines.push(indent + l.padEnd(DUAL_COL_WIDTH) + r)
  }
  return lines
}

function dualDialogueHtml(
  leftName: string,
  leftText: string,
  rightName: string,
  rightText: string,
): string {
  const leftDialogue = leftText
    .split('\n')
    .map((l) => `<p class="dialogue">${escapeHtml(l)}</p>`)
    .join('')
  const rightDialogue = rightText
    .split('\n')
    .map((l) => `<p class="dialogue">${escapeHtml(l)}</p>`)
    .join('')
  return `<div class="dual-dialogue"><div class="dual-col"><p class="character">${escapeHtml(leftName.toUpperCase())}</p>${leftDialogue}</div><div class="dual-col"><p class="character">${escapeHtml(rightName.toUpperCase())}</p>${rightDialogue}</div></div>`
}

function formatElement(
  el: ScriptElement,
  settings: FormatSettings,
  characterNames: string[] = [],
): string[] {
  const ci = settings.characterIndent
  const di = settings.dialogueIndent
  const pi = settings.parentheticalIndent
  const si = settings.stageDirectionIndent

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
        pad(' ', si) +
          formatStageDirection(
            capitalizeNamesInDirection(el.text, characterNames),
            settings.stageDirectionStyle,
          ),
        '',
      ]
    case 'character': {
      const lines = [
        pad(' ', ci) + el.text.toUpperCase(),
        ...(settings.doubleSpaceAfterCharacter ? [''] : []),
      ]
      if (el.dualCharacter) {
        lines.push(pad(' ', ci) + el.dualCharacter.toUpperCase())
        if (settings.doubleSpaceAfterCharacter) lines.push('')
      }
      return lines
    }
    case 'parenthetical':
      return [pad(' ', pi) + `(${el.text})`]
    case 'dialogue':
      return el.text.split('\n').map((line) => pad(' ', di) + line)
    case 'lyrics':
      return [
        '',
        ...el.text
          .split('\n')
          .map((line) => pad(' ', di + 0.5) + formatLyricsLine(line, settings)),
        '',
      ]
    case 'song_heading':
      return ['', pad(' ', 20) + `"${el.text}"`, '']
    case 'stage_direction':
      return [
        pad(' ', si) +
          formatStageDirection(
            capitalizeNamesInDirection(el.text, characterNames),
            settings.stageDirectionStyle,
          ),
        '',
      ]
    case 'transition':
      return ['', pad(' ', 35) + el.text.toUpperCase(), '']
    default:
      return [el.text]
  }
}

export function extractTitlePageInfo(elements: ScriptElement[]): {
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

export function getScriptSections(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
  typeOverrides: TypeOverrides = {},
) {
  const parsed = mergeDialogueLines(
    applyTypeOverrides(parseScript(raw), typeOverrides),
  )
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
    bodyStart >= 0
      ? parsed.slice(bodyStart)
      : parsed.filter((e) => !['title', 'subtitle', 'author'].includes(e.type))

  return { elements: parsed, mergedSettings, bodyElements }
}

export function formatScript(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
  typeOverrides: TypeOverrides = {},
  castMetadata: CastMetadata = {},
): FormattedScript {
  const { elements: parsed, mergedSettings, bodyElements } = getScriptSections(
    raw,
    settings,
    typeOverrides,
  )

  const outputLines: string[] = []
  const characterNames = collectCharacterNames(parsed)
  const castMembers = mergeCastWithDetected(characterNames, castMetadata)

  if (mergedSettings.showTitlePage) {
    outputLines.push(...buildTitlePage(mergedSettings))
    outputLines.push('', '—'.repeat(40), '')
  }

  if (mergedSettings.showCastPage && castMembers.length > 0) {
    outputLines.push(...formatCastPagePlain(castMembers, mergedSettings.marginLeft))
    outputLines.push('', '—'.repeat(40), '')
  }

  for (let i = 0; i < bodyElements.length; i++) {
    const el = bodyElements[i]
    const prev = bodyElements[i - 1]

    if (
      el.type === 'dialogue' &&
      prev?.type === 'character' &&
      prev.dualCharacter &&
      prev.dualDialogue
    ) {
      outputLines.push(
        ...formatDualDialoguePlain(
          prev.text,
          el.text,
          prev.dualCharacter,
          prev.dualDialogue,
          mergedSettings,
        ),
      )
      continue
    }

    if (el.type === 'character' && el.dualCharacter && el.dualDialogue) {
      continue
    }

    outputLines.push(...formatElement(el, mergedSettings, characterNames))
  }

  const pageCount = estimatePageCount(bodyElements, mergedSettings)

  return {
    elements: parsed,
    plainText: outputLines.join('\n').replace(/\n{4,}/g, '\n\n\n'),
    warnings: collectWarnings(parsed),
    pageCount,
    estimatedRuntimeMinutes: estimateRuntimeMinutes(
      pageCount,
      mergedSettings.showTitlePage,
    ),
  }
}

function elementToHtml(
  el: ScriptElement,
  settings: FormatSettings,
  characterNames: string[] = [],
): string {
  switch (el.type) {
    case 'blank':
      return '<div class="spacer"></div>'
    case 'act':
      return `<p class="act">ACT ${escapeHtml(formatNumber(el.text, settings.actSceneStyle))}</p>`
    case 'scene':
      return `<p class="scene">SCENE ${escapeHtml(formatNumber(el.text, settings.actSceneStyle))}</p>`
    case 'setting':
      return `<p class="setting">${escapeHtml(formatStageDirection(capitalizeNamesInDirection(el.text, characterNames), settings.stageDirectionStyle))}</p>`
    case 'character':
      return `<p class="character">${escapeHtml(el.text.toUpperCase())}</p>`
    case 'parenthetical':
      return `<p class="parenthetical">(${escapeHtml(el.text)})</p>`
    case 'dialogue':
      return el.text
        .split('\n')
        .map((line) => `<p class="dialogue">${escapeHtml(line)}</p>`)
        .join('')
    case 'lyrics':
      return el.text
        .split('\n')
        .map(
          (line) =>
            `<p class="lyrics">${escapeHtml(formatLyricsLine(line, settings))}</p>`,
        )
        .join('')
    case 'song_heading':
      return `<p class="song-heading">"${escapeHtml(el.text)}"</p>`
    case 'stage_direction':
      return `<p class="direction">${escapeHtml(formatStageDirection(capitalizeNamesInDirection(el.text, characterNames), settings.stageDirectionStyle))}</p>`
    case 'transition':
      return `<p class="transition">${escapeHtml(el.text.toUpperCase())}</p>`
    default:
      return ''
  }
}

function renderBodyHtml(
  bodyElements: ScriptElement[],
  settings: FormatSettings,
  characterNames: string[],
): string {
  const chunks: string[] = []
  for (let i = 0; i < bodyElements.length; i++) {
    const el = bodyElements[i]
    const prev = bodyElements[i - 1]

    if (
      el.type === 'dialogue' &&
      prev?.type === 'character' &&
      prev.dualCharacter &&
      prev.dualDialogue
    ) {
      chunks.push(
        dualDialogueHtml(prev.text, el.text, prev.dualCharacter, prev.dualDialogue),
      )
      continue
    }

    if (el.type === 'character' && el.dualCharacter && el.dualDialogue) {
      continue
    }

    chunks.push(elementToHtml(el, settings, characterNames))
  }
  return chunks.join('\n')
}

export function formatScriptToHtml(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
  typeOverrides: TypeOverrides = {},
  castMetadata: CastMetadata = {},
): string {
  const { elements, mergedSettings, bodyElements } = getScriptSections(
    raw,
    settings,
    typeOverrides,
  )

  const characterNames = collectCharacterNames(elements)
  const castMembers = mergeCastWithDetected(characterNames, castMetadata)
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
    if (mergedSettings.titlePage.copyright) {
      parts.push(
        `<p class="copyright">${escapeHtml(mergedSettings.titlePage.copyright)}</p>`,
      )
    }
    if (mergedSettings.titlePage.contact) {
      parts.push(
        `<p class="contact">${escapeHtml(mergedSettings.titlePage.contact)}</p>`,
      )
    }
    parts.push('</div>')
  }

  if (mergedSettings.showCastPage && castMembers.length > 0) {
    parts.push(formatCastPageHtml(castMembers))
  }

  const frontMatterPages =
    (mergedSettings.showTitlePage ? 1 : 0) +
    (mergedSettings.showCastPage && castMembers.length > 0 ? 1 : 0)

  const pages = paginateElements(bodyElements, mergedSettings, frontMatterPages > 0)
  const scriptPages = pages.slice(frontMatterPages)
  const startPageNum = mergedSettings.pageNumberStartsAt

  scriptPages.forEach((page, idx) => {
    const displayPageNum = startPageNum + idx
    parts.push(`<div class="script-page-body" data-page="${displayPageNum}">`)

    if (mergedSettings.includePageNumbers) {
      parts.push(
        `<div class="page-header"><span class="page-title">${escapeHtml(mergedSettings.titlePage.title)}</span><span class="page-num">${displayPageNum}</span></div>`,
      )
    }

    parts.push(renderBodyHtml(page.elements, mergedSettings, characterNames))
    parts.push('</div>')
  })

  if (scriptPages.length === 0 && bodyElements.length > 0) {
    parts.push('<div class="script-page-body" data-page="1">')
    parts.push(renderBodyHtml(bodyElements, mergedSettings, characterNames))
    parts.push('</div>')
  }

  return parts.join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
