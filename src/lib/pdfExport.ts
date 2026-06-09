import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { CastMetadata, FormatSettings, ScriptElement } from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'
import {
  formatCastEntry,
  mergeCastWithDetected,
} from './castPage'
import {
  collectCharacterNames,
  formatNumber,
  formatStageDirection,
  getScriptSections,
} from './formatter'
import { countFrontMatterPages, paginateElements } from './pagination'
import { downloadBlob, sanitizeFilename } from './export'

const POINTS_PER_INCH = 72

function inchToPt(inches: number): number {
  return inches * POINTS_PER_INCH
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function drawTitlePage(
  page: ReturnType<PDFDocument['addPage']>,
  settings: FormatSettings,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
) {
  const { width, height } = page.getSize()
  const { titlePage } = settings
  const fontSize = settings.fontSize
  const centerX = (text: string, size: number) =>
    width / 2 - (text.length * size * 0.28) / 2

  page.drawText(titlePage.title.toUpperCase(), {
    x: centerX(titlePage.title, fontSize + 4),
    y: height / 2 + 50,
    size: fontSize + 4,
    font: bold,
    color: rgb(0, 0, 0),
  })

  if (titlePage.subtitle) {
    page.drawText(titlePage.subtitle, {
      x: centerX(titlePage.subtitle, fontSize),
      y: height / 2 + 15,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
  }

  if (titlePage.author) {
    const by = `by ${titlePage.author}`
    page.drawText(by, {
      x: centerX(by, fontSize),
      y: height / 2 - 40,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
  }

  const bottomY = inchToPt(settings.marginBottom) + 20

  if (titlePage.copyright) {
    page.drawText(titlePage.copyright, {
      x: inchToPt(settings.marginLeft),
      y: bottomY,
      size: fontSize - 1,
      font,
      color: rgb(0, 0, 0),
    })
  }

  if (titlePage.contact) {
    const contactLines = titlePage.contact.split('\n')
    let y = bottomY
    for (const line of contactLines) {
      page.drawText(line, {
        x: width - inchToPt(settings.marginRight) - line.length * (fontSize - 1) * 0.28,
        y,
        size: fontSize - 1,
        font,
        color: rgb(0, 0, 0),
      })
      y -= fontSize + 2
    }
  }
}

function drawCastPage(
  page: ReturnType<PDFDocument['addPage']>,
  members: ReturnType<typeof mergeCastWithDetected>,
  settings: FormatSettings,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
) {
  const { width, height } = page.getSize()
  const fontSize = settings.fontSize
  const title = 'CAST OF CHARACTERS'

  page.drawText(title, {
    x: width / 2 - (title.length * fontSize * 0.3) / 2,
    y: height - inchToPt(settings.marginTop) - 40,
    size: fontSize,
    font: bold,
    color: rgb(0, 0, 0),
  })

  let y = height - inchToPt(settings.marginTop) - 80
  for (const member of members) {
    const line = formatCastEntry(member)
    for (const wrapped of wrapText(line, 70)) {
      page.drawText(wrapped, {
        x: inchToPt(settings.marginLeft),
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      y -= fontSize * 1.6
    }
  }
}

function drawDualDialogue(
  page: ReturnType<PDFDocument['addPage']>,
  leftName: string,
  leftText: string,
  rightName: string,
  rightText: string,
  settings: FormatSettings,
  y: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
): number {
  const fontSize = settings.fontSize
  const lineHeight = fontSize * 1.6
  const leftX = inchToPt(settings.dialogueIndent)
  const rightX = inchToPt(4.75)
  let currentY = y - lineHeight * 0.5

  page.drawText(leftName.toUpperCase(), {
    x: leftX,
    y: currentY,
    size: fontSize,
    font: bold,
    color: rgb(0, 0, 0),
  })
  page.drawText(rightName.toUpperCase(), {
    x: rightX,
    y: currentY,
    size: fontSize,
    font: bold,
    color: rgb(0, 0, 0),
  })
  currentY -= lineHeight

  const leftLines = leftText.split('\n')
  const rightLines = rightText.split('\n')
  const rows = Math.max(leftLines.length, rightLines.length)

  for (let i = 0; i < rows; i++) {
    const l = leftLines[i] ?? ''
    const r = rightLines[i] ?? ''
    if (l) {
      page.drawText(l, { x: leftX, y: currentY, size: fontSize, font, color: rgb(0, 0, 0) })
    }
    if (r) {
      page.drawText(r, { x: rightX, y: currentY, size: fontSize, font, color: rgb(0, 0, 0) })
    }
    currentY -= lineHeight
  }

  return currentY
}

function drawElement(
  page: ReturnType<PDFDocument['addPage']>,
  el: ScriptElement,
  settings: FormatSettings,
  y: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  italic: Awaited<ReturnType<PDFDocument['embedFont']>>,
  characterNames: string[],
): number {
  const fontSize = settings.fontSize
  const lineHeight = fontSize * 1.6
  let currentY = y

  const capitalize = (text: string) => {
    let result = text
    for (const name of characterNames) {
      result = result.replace(new RegExp(`\\b${name}\\b`, 'gi'), name)
    }
    return result
  }

  const draw = (
    text: string,
    x: number,
    f = font,
    opts: { bold?: boolean; italic?: boolean } = {},
  ) => {
    const useFont = opts.bold ? bold : opts.italic ? italic : f
    page.drawText(text, {
      x,
      y: currentY,
      size: fontSize,
      font: useFont,
      color: rgb(0, 0, 0),
    })
    currentY -= lineHeight
  }

  switch (el.type) {
    case 'act':
      currentY -= lineHeight
      draw(
        `ACT ${formatNumber(el.text, settings.actSceneStyle)}`,
        page.getWidth() / 2 - 30,
        bold,
        { bold: true },
      )
      currentY -= lineHeight
      break
    case 'scene':
      currentY -= lineHeight
      draw(
        `SCENE ${formatNumber(el.text, settings.actSceneStyle)}`,
        page.getWidth() / 2 - 35,
        bold,
        { bold: true },
      )
      currentY -= lineHeight
      break
    case 'setting':
    case 'stage_direction': {
      const text = formatStageDirection(
        capitalize(el.text),
        settings.stageDirectionStyle,
      )
      for (const line of wrapText(text, 60)) {
        draw(line, inchToPt(settings.stageDirectionIndent), font, {
          italic: settings.stageDirectionStyle === 'italic',
        })
      }
      currentY -= lineHeight * 0.5
      break
    }
    case 'character':
      currentY -= lineHeight * 0.5
      draw(el.text.toUpperCase(), inchToPt(settings.characterIndent), bold, { bold: true })
      if (settings.doubleSpaceAfterCharacter) currentY -= lineHeight * 0.5
      break
    case 'parenthetical':
      draw(`(${el.text})`, inchToPt(settings.parentheticalIndent), italic, { italic: true })
      break
    case 'dialogue':
      for (const line of el.text.split('\n')) {
        for (const wrapped of wrapText(line, 35)) {
          draw(wrapped, inchToPt(settings.dialogueIndent))
        }
      }
      break
    case 'lyrics':
      currentY -= lineHeight * 0.5
      for (const line of el.text.split('\n')) {
        const text =
          settings.lyricsStyle === 'uppercase' ? line.toUpperCase() : line
        draw(text, inchToPt(settings.dialogueIndent + 0.5), bold, { bold: true })
      }
      currentY -= lineHeight * 0.5
      break
    case 'song_heading':
      currentY -= lineHeight
      draw(`"${el.text}"`, page.getWidth() / 2 - 40, bold, { bold: true })
      currentY -= lineHeight
      break
    case 'transition':
      currentY -= lineHeight
      draw(el.text.toUpperCase(), inchToPt(5.5), bold, { bold: true })
      currentY -= lineHeight
      break
    case 'blank':
      currentY -= lineHeight * 0.5
      break
    default:
      break
  }

  return currentY
}

function renderBodyElements(
  page: ReturnType<PDFDocument['addPage']>,
  elements: ScriptElement[],
  settings: FormatSettings,
  startY: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  italic: Awaited<ReturnType<PDFDocument['embedFont']>>,
  characterNames: string[],
  contentBottom: number,
): void {
  let y = startY

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const prev = elements[i - 1]

    if (
      el.type === 'dialogue' &&
      prev?.type === 'character' &&
      prev.dualCharacter &&
      prev.dualDialogue
    ) {
      y = drawDualDialogue(
        page,
        prev.text,
        el.text,
        prev.dualCharacter,
        prev.dualDialogue,
        settings,
        y,
        font,
        bold,
      )
      continue
    }

    if (el.type === 'character' && el.dualCharacter && el.dualDialogue) continue

    if (y < contentBottom) break
    y = drawElement(page, el, settings, y, font, bold, italic, characterNames)
  }
}

export async function buildScriptPdf(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
  castMetadata: CastMetadata = {},
): Promise<Blob> {
  const { elements, mergedSettings, bodyElements } = getScriptSections(raw, settings)
  const characterNames = collectCharacterNames(elements)
  const castMembers = mergeCastWithDetected(characterNames, castMetadata)

  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Courier)
  const bold = await pdf.embedFont(StandardFonts.CourierBold)
  const italic = await pdf.embedFont(StandardFonts.CourierOblique)

  const pageWidth = inchToPt(8.5)
  const pageHeight = inchToPt(11)
  const contentTop = pageHeight - inchToPt(mergedSettings.marginTop) - 20
  const contentBottom = inchToPt(mergedSettings.marginBottom) + 30

  if (mergedSettings.showTitlePage) {
    drawTitlePage(pdf.addPage([pageWidth, pageHeight]), mergedSettings, font, bold)
  }

  if (mergedSettings.showCastPage && castMembers.length > 0) {
    drawCastPage(
      pdf.addPage([pageWidth, pageHeight]),
      castMembers,
      mergedSettings,
      font,
      bold,
    )
  }

  const frontMatter = countFrontMatterPages(mergedSettings)
  const pages = paginateElements(bodyElements, mergedSettings, frontMatter > 0)
  const scriptPages = pages.slice(frontMatter)
  const startPageNum = mergedSettings.pageNumberStartsAt

  if (scriptPages.length === 0) {
    const page = pdf.addPage([pageWidth, pageHeight])
    if (mergedSettings.includePageNumbers) {
      page.drawText(mergedSettings.titlePage.title, {
        x: inchToPt(mergedSettings.marginLeft),
        y: pageHeight - inchToPt(mergedSettings.marginTop),
        size: mergedSettings.fontSize - 1,
        font,
        color: rgb(0.4, 0.4, 0.4),
      })
      page.drawText(String(startPageNum), {
        x: pageWidth - inchToPt(mergedSettings.marginRight) - 20,
        y: contentBottom - 10,
        size: mergedSettings.fontSize,
        font,
        color: rgb(0, 0, 0),
      })
    }
    renderBodyElements(
      page,
      bodyElements,
      mergedSettings,
      contentTop,
      font,
      bold,
      italic,
      characterNames,
      contentBottom,
    )
  } else {
    scriptPages.forEach((scriptPage, idx) => {
      const page = pdf.addPage([pageWidth, pageHeight])
      const displayPageNum = startPageNum + idx

      if (mergedSettings.includePageNumbers) {
        page.drawText(mergedSettings.titlePage.title, {
          x: inchToPt(mergedSettings.marginLeft),
          y: pageHeight - inchToPt(mergedSettings.marginTop),
          size: mergedSettings.fontSize - 1,
          font,
          color: rgb(0.4, 0.4, 0.4),
        })
        page.drawText(String(displayPageNum), {
          x: pageWidth - inchToPt(mergedSettings.marginRight) - 20,
          y: contentBottom - 10,
          size: mergedSettings.fontSize,
          font,
          color: rgb(0, 0, 0),
        })
      }

      renderBodyElements(
        page,
        scriptPage.elements,
        mergedSettings,
        contentTop,
        font,
        bold,
        italic,
        characterNames,
        contentBottom,
      )
    })
  }

  const bytes = await pdf.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

export async function downloadScriptPdf(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
  castMetadata: CastMetadata = {},
): Promise<void> {
  const blob = await buildScriptPdf(raw, settings, castMetadata)
  const name = sanitizeFilename(settings.titlePage.title || 'play-script')
  downloadBlob(blob, `${name}.pdf`, 'application/pdf')
}
