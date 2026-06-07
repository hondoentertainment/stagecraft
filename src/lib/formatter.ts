import type {
  FormatSettings,
  FormattedScript,
  ScriptElement,
  TypeOverrides,
} from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'
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

const MAX_DIALOGUE_CHARS = 35

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

function buildCastPagePlain(
  elements: ScriptElement[],
  settings: FormatSettings,
): string[] {
  const names = collectCharacterNames(elements)
  const lines: string[] = ['', pad(' ', 22) + 'CAST OF CHARACTERS', '', '']
  for (const name of names.sort()) {
    lines.push(pad(' ', settings.marginLeft * 10) + name)
  }
  lines.push('', '')
  return lines
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

function collectWarnings(elements: ScriptElement[]): string[] {
  const warnings: string[] = []
  let hasCharacter = false
  let hasDialogue = false
  let orphanDialogue = 0
  let longDialogue = 0
  let lowercaseCharacter = 0
  let sceneWithoutSetting = 0
  const characterNames = new Map<string, string>()

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]

    if (el.type === 'character') {
      hasCharacter = true
      const normalized = el.text.replace(/\s*\([^)]*\)/g, '').trim()
      const upper = normalized.toUpperCase()
      if (normalized !== upper) lowercaseCharacter++

      const existing = characterNames.get(upper)
      if (existing && existing !== el.text) {
        warnings.push(
          `Inconsistent character name: "${existing}" vs "${el.text}" — standardize spelling.`,
        )
      }
      characterNames.set(upper, el.text)
    }

    if (el.type === 'dialogue') {
      hasDialogue = true
      const prev = elements
        .slice(0, i)
        .reverse()
        .find((e) => e.type !== 'blank')
      if (prev?.type !== 'character' && prev?.type !== 'parenthetical') {
        orphanDialogue++
      }
      for (const line of el.text.split('\n')) {
        if (line.length > MAX_DIALOGUE_CHARS) longDialogue++
      }
    }

    if (el.type === 'scene') {
      const next = elements.slice(i + 1).find((e) => e.type !== 'blank')
      if (next?.type !== 'setting' && next?.type !== 'stage_direction') {
        sceneWithoutSetting++
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
  if (lowercaseCharacter > 0) {
    warnings.push(
      `${lowercaseCharacter} character name(s) are not ALL CAPS — use uppercase for cues.`,
    )
  }
  if (longDialogue > 0) {
    warnings.push(
      `${longDialogue} dialogue line(s) exceed ~${MAX_DIALOGUE_CHARS} characters — may be too wide on the page.`,
    )
  }
  if (sceneWithoutSetting > 0) {
    warnings.push(
      `${sceneWithoutSetting} scene heading(s) lack a setting line — add location/description.`,
    )
  }

  return [...new Set(warnings)]
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
): FormattedScript {
  const { elements: parsed, mergedSettings, bodyElements } = getScriptSections(
    raw,
    settings,
    typeOverrides,
  )

  const outputLines: string[] = []

  const characterNames = collectCharacterNames(parsed)

  if (mergedSettings.showTitlePage) {
    outputLines.push(...buildTitlePage(mergedSettings))
    outputLines.push('', '—'.repeat(40), '')
  }

  if (mergedSettings.showCastPage && characterNames.length > 0) {
    outputLines.push(...buildCastPagePlain(parsed, mergedSettings))
    outputLines.push('', '—'.repeat(40), '')
  }

  for (const el of bodyElements) {
    const formatted = formatElement(el, mergedSettings, characterNames)
    outputLines.push(...formatted)
    if (el.type === 'character' && el.dualCharacter && el.dualDialogue) {
      outputLines.push(
        ...el.dualDialogue.split('\n').map((line) => pad(' ', mergedSettings.dialogueIndent) + line),
      )
    }
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
    case 'character': {
      let html = `<p class="character">${escapeHtml(el.text.toUpperCase())}</p>`
      if (el.dualCharacter) {
        html += `<p class="character dual">${escapeHtml(el.dualCharacter.toUpperCase())}</p>`
      }
      return html
    }
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

export function formatScriptToHtml(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
  typeOverrides: TypeOverrides = {},
): string {
  const { elements, mergedSettings, bodyElements } = getScriptSections(
    raw,
    settings,
    typeOverrides,
  )

  const characterNames = collectCharacterNames(elements)
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

  if (mergedSettings.showCastPage && characterNames.length > 0) {
    parts.push('<div class="cast-page">')
    parts.push('<h2>Cast of Characters</h2>')
    parts.push('<ul>')
    for (const name of [...characterNames].sort()) {
      parts.push(`<li>${escapeHtml(name)}</li>`)
    }
    parts.push('</ul></div>')
  }

  const frontMatterPages =
    (mergedSettings.showTitlePage ? 1 : 0) + (mergedSettings.showCastPage ? 1 : 0)

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

    for (const el of page.elements) {
      parts.push(elementToHtml(el, mergedSettings, characterNames))
      if (el.type === 'character' && el.dualCharacter && el.dualDialogue) {
        parts.push(
          el.dualDialogue
            .split('\n')
            .map((line) => `<p class="dialogue dual">${escapeHtml(line)}</p>`)
            .join(''),
        )
      }
    }

    parts.push('</div>')
  })

  if (scriptPages.length === 0 && bodyElements.length > 0) {
    parts.push('<div class="script-page-body" data-page="1">')
    for (const el of bodyElements) {
      parts.push(elementToHtml(el, mergedSettings, characterNames))
    }
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
