import {
  AlignmentType,
  Document,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from 'docx'
import type { FormatSettings, ScriptElement } from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'
import {
  formatNumber,
  formatStageDirection,
  getScriptSections,
} from './formatter'
import { downloadBlob, sanitizeFilename } from './export'

const SCRIPT_FONT = 'Courier New'

function ptToHalfPoints(pt: number): number {
  return pt * 2
}

function scriptRun(
  text: string,
  settings: FormatSettings,
  opts: { bold?: boolean; italics?: boolean } = {},
): TextRun {
  return new TextRun({
    text,
    font: SCRIPT_FONT,
    size: ptToHalfPoints(settings.fontSize),
    bold: opts.bold,
    italics: opts.italics,
  })
}

function emptyLine(settings: FormatSettings): Paragraph {
  return new Paragraph({
    children: [scriptRun('', settings)],
    spacing: { after: 120 },
  })
}

function buildTitlePageParagraphs(settings: FormatSettings): Paragraph[] {
  const { titlePage } = settings
  const paragraphs: Paragraph[] = [
    emptyLine(settings),
    emptyLine(settings),
    emptyLine(settings),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        scriptRun(titlePage.title.toUpperCase(), settings, { bold: true }),
      ],
      spacing: { after: 200 },
    }),
  ]

  if (titlePage.subtitle) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [scriptRun(titlePage.subtitle, settings, { italics: true })],
        spacing: { after: 200 },
      }),
    )
  }

  paragraphs.push(emptyLine(settings), emptyLine(settings))

  if (titlePage.author) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [scriptRun(`by ${titlePage.author}`, settings)],
        spacing: { after: 200 },
      }),
    )
  }

  if (titlePage.contact) {
    paragraphs.push(
      emptyLine(settings),
      emptyLine(settings),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [scriptRun(titlePage.contact, settings)],
        spacing: { after: 200 },
      }),
    )
  }

  paragraphs.push(
    emptyLine(settings),
    emptyLine(settings),
    new Paragraph({
      children: [new PageBreak()],
    }),
  )

  return paragraphs
}

function stageDirectionItalic(
  settings: FormatSettings,
): boolean {
  return settings.stageDirectionStyle !== 'plain'
}

function elementToParagraphs(
  el: ScriptElement,
  settings: FormatSettings,
): Paragraph[] {
  const inch = convertInchesToTwip

  switch (el.type) {
    case 'blank':
      return [emptyLine(settings)]
    case 'act':
      return [
        emptyLine(settings),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            scriptRun(
              `ACT ${formatNumber(el.text, settings.actSceneStyle)}`,
              settings,
              { bold: true },
            ),
          ],
          spacing: { before: 360, after: 240 },
        }),
        emptyLine(settings),
      ]
    case 'scene':
      return [
        emptyLine(settings),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            scriptRun(
              `SCENE ${formatNumber(el.text, settings.actSceneStyle)}`,
              settings,
              { bold: true },
            ),
          ],
          spacing: { before: 360, after: 240 },
        }),
        emptyLine(settings),
      ]
    case 'setting':
      return [
        new Paragraph({
          children: [
            scriptRun(
              formatStageDirection(el.text, settings.stageDirectionStyle),
              settings,
              { italics: stageDirectionItalic(settings) },
            ),
          ],
          spacing: { after: 200 },
        }),
      ]
    case 'character':
      return [
        new Paragraph({
          indent: { left: inch(settings.characterIndent) },
          children: [scriptRun(el.text.toUpperCase(), settings, { bold: true })],
          spacing: {
            before: 240,
            after: settings.doubleSpaceAfterCharacter ? 120 : 0,
          },
        }),
      ]
    case 'parenthetical':
      return [
        new Paragraph({
          indent: { left: inch(settings.parentheticalIndent) },
          children: [scriptRun(`(${el.text})`, settings, { italics: true })],
          spacing: { after: 60 },
        }),
      ]
    case 'dialogue':
      return el.text.split('\n').map(
        (line) =>
          new Paragraph({
            indent: { left: inch(settings.dialogueIndent) },
            children: [scriptRun(line, settings)],
            spacing: { after: 60 },
          }),
      )
    case 'stage_direction':
      return [
        new Paragraph({
          children: [
            scriptRun(
              formatStageDirection(el.text, settings.stageDirectionStyle),
              settings,
              { italics: stageDirectionItalic(settings) },
            ),
          ],
          spacing: { after: 200 },
        }),
      ]
    case 'transition':
      return [
        emptyLine(settings),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [scriptRun(el.text.toUpperCase(), settings, { bold: true })],
          spacing: { before: 240, after: 240 },
        }),
        emptyLine(settings),
      ]
    default:
      return []
  }
}

export async function buildScriptDocx(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): Promise<Blob> {
  const { mergedSettings, bodyElements } = getScriptSections(raw, settings)
  const children: Paragraph[] = []

  if (mergedSettings.showTitlePage) {
    children.push(...buildTitlePageParagraphs(mergedSettings))
  }

  for (const el of bodyElements) {
    children.push(...elementToParagraphs(el, mergedSettings))
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.5),
            },
          },
        },
        children,
      },
    ],
  })

  return Packer.toBlob(doc)
}

export async function downloadScriptDocx(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): Promise<void> {
  const blob = await buildScriptDocx(raw, settings)
  const name = sanitizeFilename(settings.titlePage.title || 'play-script')
  downloadBlob(
    blob,
    `${name}.docx`,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  )
}
