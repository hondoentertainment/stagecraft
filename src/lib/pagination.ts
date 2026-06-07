import type { FormatSettings, ScriptElement } from '../types/script'

export const CHARS_PER_LINE = 60

export interface ScriptPage {
  pageNumber: number
  elements: ScriptElement[]
  lineCount: number
}

export function estimateElementLines(
  el: ScriptElement,
  settings: FormatSettings,
): number {
  switch (el.type) {
    case 'blank':
      return 1
    case 'act':
    case 'scene':
    case 'song_heading':
      return 3
    case 'character':
      return settings.doubleSpaceAfterCharacter ? 2 : 1
    case 'parenthetical':
      return 1
    case 'dialogue':
      return el.text.split('\n').reduce(
        (sum, line) => sum + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)),
        0,
      )
    case 'lyrics':
      return (
        el.text.split('\n').length +
        el.text.split('\n').reduce(
          (sum, line) =>
            sum + Math.max(0, Math.ceil(line.length / CHARS_PER_LINE) - 1),
          0,
        ) +
        1
      )
    case 'stage_direction':
    case 'setting':
      return Math.max(1, Math.ceil(el.text.length / CHARS_PER_LINE)) + 1
    case 'transition':
      return 3
    default:
      return 1
  }
}

export function countTotalLines(
  elements: ScriptElement[],
  settings: FormatSettings,
): number {
  return elements.reduce(
    (sum, el) => sum + estimateElementLines(el, settings),
    0,
  )
}

export function paginateElements(
  elements: ScriptElement[],
  settings: FormatSettings,
  includeTitlePage = false,
): ScriptPage[] {
  const linesPerPage = settings.linesPerPage
  const pages: ScriptPage[] = []
  let currentPage: ScriptPage = { pageNumber: 1, elements: [], lineCount: 0 }

  if (includeTitlePage) {
    pages.push({ pageNumber: 0, elements: [], lineCount: linesPerPage })
    currentPage = { pageNumber: 1, elements: [], lineCount: 0 }
  }

  for (const el of elements) {
    const lines = estimateElementLines(el, settings)

    if (currentPage.lineCount + lines > linesPerPage && currentPage.elements.length > 0) {
      pages.push(currentPage)
      currentPage = {
        pageNumber: pages.length + (includeTitlePage ? 0 : 0),
        elements: [],
        lineCount: 0,
      }
    }

    currentPage.elements.push(el)
    currentPage.lineCount += lines

    if (currentPage.lineCount >= linesPerPage) {
      pages.push(currentPage)
      currentPage = {
        pageNumber: pages.length + 1,
        elements: [],
        lineCount: 0,
      }
    }
  }

  if (currentPage.elements.length > 0) {
    pages.push(currentPage)
  }

  return pages.map((page, i) => ({
    ...page,
    pageNumber: includeTitlePage ? i : i + 1,
  }))
}

export function countFrontMatterPages(settings: FormatSettings): number {
  let pages = 0
  if (settings.showTitlePage) pages++
  if (settings.showCastPage) pages++
  return pages
}

export function estimatePageCount(
  elements: ScriptElement[],
  settings: FormatSettings,
  showTitlePage?: boolean,
): number {
  const bodyLines = countTotalLines(elements, settings)
  const bodyPages = Math.max(1, Math.ceil(bodyLines / settings.linesPerPage))
  const frontMatter =
    showTitlePage !== undefined
      ? showTitlePage
        ? 1
        : 0
      : countFrontMatterPages(settings)
  return bodyPages + frontMatter
}

export function estimateRuntimeMinutes(pageCount: number, showTitlePage: boolean): number {
  const scriptPages = showTitlePage ? Math.max(0, pageCount - 1) : pageCount
  return Math.max(1, Math.round(scriptPages))
}
