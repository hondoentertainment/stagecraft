import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { FormatSettings, ScriptElement } from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'
import { formatNumber, formatStageDirection, getScriptSections } from './formatter'
import { estimateElementLines, paginateElements } from './pagination'
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

async function drawTitlePage(
  page: ReturnType<PDFDocument['addPage']>,
  settings: FormatSettings,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
) {
  const { width, height } = page.getSize()
  const { titlePage } = settings
  const fontSize = settings.fontSize

  page.drawText(titlePage.title.toUpperCase(), {
    x: width / 2 - (titlePage.title.length * fontSize * 0.3) / 2,
    y: height / 2 + 40,
    size: fontSize + 4,
    font: bold,
    color: rgb(0, 0, 0),
  })

  if (titlePage.subtitle) {
    page.drawText(titlePage.subtitle, {
      x: width / 2 - (titlePage.subtitle.length * fontSize * 0.25) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
  }

  if (titlePage.author) {
    page.drawText(`by ${titlePage.author}`, {
      x: width / 2 - (`by ${titlePage.author}`.length * fontSize * 0.25) / 2,
      y: height / 2 - 80,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
  }

  if (titlePage.contact) {
    const contactLines = titlePage.contact.split('\n')
    let y = inchToPt(settings.marginBottom) + 20
    for (const line of contactLines) {
      page.drawText(line, {
        x: width / 2 - (line.length * fontSize * 0.25) / 2,
        y,
        size: fontSize - 1,
        font,
        color: rgb(0, 0, 0),
      })
      y += fontSize + 4
    }
  }
}

function drawElement(
  page: ReturnType<PDFDocument['addPage']>,
  el: ScriptElement,
  settings: FormatSettings,
  y: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  italic: Awaited<ReturnType<PDFDocument['embedFont']>>,
): number {
  const fontSize = settings.fontSize
  const lineHeight = fontSize * 1.6
  const left = inchToPt(settings.marginLeft)
  let currentY = y

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
      const text = formatStageDirection(el.text, settings.stageDirectionStyle)
      for (const line of wrapText(text, 60)) {
        draw(line, left, italic, { italic: settings.stageDirectionStyle !== 'plain' })
      }
      currentY -= lineHeight * 0.5
      break
    }
    case 'character':
      currentY -= lineHeight * 0.5
      draw(el.text.toUpperCase(), inchToPt(settings.characterIndent), bold, {
        bold: true,
      })
      if (settings.doubleSpaceAfterCharacter) currentY -= lineHeight * 0.5
      if (el.dualCharacter) {
        draw(el.dualCharacter.toUpperCase(), inchToPt(settings.characterIndent), bold, {
          bold: true,
        })
      }
      break
    case 'parenthetical':
      draw(`(${el.text})`, inchToPt(settings.parentheticalIndent), italic, {
        italic: true,
      })
      break
    case 'dialogue':
      for (const line of el.text.split('\n')) {
        for (const wrapped of wrapText(line, 35)) {
          draw(wrapped, inchToPt(settings.dialogueIndent))
        }
      }
      if (el.dualDialogue) {
        for (const line of el.dualDialogue.split('\n')) {
          for (const wrapped of wrapText(line, 35)) {
            draw(wrapped, inchToPt(settings.dialogueIndent + 2))
          }
        }
      }
      break
    case 'lyrics':
      currentY -= lineHeight * 0.5
      for (const line of el.text.split('\n')) {
        draw(line, inchToPt(settings.dialogueIndent + 0.5), italic, { italic: true })
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

export async function buildScriptPdf(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): Promise<Blob> {
  const { mergedSettings, bodyElements } = getScriptSections(raw, settings)
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Courier)
  const bold = await pdf.embedFont(StandardFonts.CourierBold)
  const italic = await pdf.embedFont(StandardFonts.CourierOblique)

  const pageWidth = inchToPt(8.5)
  const pageHeight = inchToPt(11)
  const topMargin = inchToPt(mergedSettings.marginTop)
  const bottomMargin = inchToPt(mergedSettings.marginBottom)
  const contentTop = pageHeight - topMargin
  const contentBottom = bottomMargin + 30

  if (mergedSettings.showTitlePage) {
    const titlePage = pdf.addPage([pageWidth, pageHeight])
    await drawTitlePage(titlePage, mergedSettings, font, bold)
  }

  const pages = paginateElements(
    bodyElements,
    mergedSettings,
    mergedSettings.showTitlePage,
  )
  const scriptPages = mergedSettings.showTitlePage ? pages.slice(1) : pages
  const startPageNum = mergedSettings.showTitlePage ? 2 : 1

  if (scriptPages.length === 0) {
    const page = pdf.addPage([pageWidth, pageHeight])
    let y = contentTop
    for (const el of bodyElements) {
      if (y < contentBottom) break
      y = drawElement(page, el, mergedSettings, y, font, bold, italic)
    }
    if (mergedSettings.includePageNumbers) {
      page.drawText(`${startPageNum}.`, {
        x: pageWidth - inchToPt(mergedSettings.marginRight) - 20,
        y: contentBottom - 10,
        size: mergedSettings.fontSize,
        font,
        color: rgb(0, 0, 0),
      })
    }
  } else {
    scriptPages.forEach((scriptPage, idx) => {
      const page = pdf.addPage([pageWidth, pageHeight])
      const displayPageNum = startPageNum + idx
      let y = contentTop

      if (mergedSettings.includePageNumbers) {
        page.drawText(mergedSettings.titlePage.title, {
          x: inchToPt(mergedSettings.marginLeft),
          y: contentTop + 15,
          size: mergedSettings.fontSize - 1,
          font,
          color: rgb(0.4, 0.4, 0.4),
        })
        page.drawText(`${displayPageNum}.`, {
          x: pageWidth - inchToPt(mergedSettings.marginRight) - 20,
          y: contentBottom - 10,
          size: mergedSettings.fontSize,
          font,
          color: rgb(0, 0, 0),
        })
      }

      for (const el of scriptPage.elements) {
        const lines = estimateElementLines(el, mergedSettings)
        if (y - lines * mergedSettings.fontSize * 1.6 < contentBottom) break
        y = drawElement(page, el, mergedSettings, y, font, bold, italic)
        if (el.type === 'character' && el.dualCharacter && el.dualDialogue) {
          y = drawElement(
            page,
            { ...el, type: 'dialogue', text: el.dualDialogue },
            mergedSettings,
            y,
            font,
            bold,
            italic,
          )
        }
      }
    })
  }

  const bytes = await pdf.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

export async function downloadScriptPdf(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): Promise<void> {
  const blob = await buildScriptPdf(raw, settings)
  const name = sanitizeFilename(settings.titlePage.title || 'play-script')
  downloadBlob(blob, `${name}.pdf`, 'application/pdf')
}
