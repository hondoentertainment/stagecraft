import {
  AlignmentType,
  Document,
  Footer,
  Header,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from 'docx'
import type { CastMetadata, FormatSettings, ScriptElement } from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'
import { formatCastEntry, mergeCastWithDetected } from './castPage'
import {
  collectCharacterNames,
  formatNumber,
  formatStageDirection,
  getScriptSections,
} from './formatter'
import { downloadBlob, sanitizeFilename } from './export'

const SCRIPT_FONT = 'Courier New'

const STYLE_NAMES: Record<string, string> = {
  character: 'Character',
  dialogue: 'Dialogue',
  parenthetical: 'Parenthetical',
  direction: 'StageDirection',
}

function ptToHalfPoints(pt: number): number {
  return pt * 2
}

function scriptRun(
  text: string,
  settings: FormatSettings,
  opts: { bold?: boolean; italics?: boolean; style?: string } = {},
): TextRun {
  return new TextRun({
    text,
    font: SCRIPT_FONT,
    size: ptToHalfPoints(settings.fontSize),
    bold: opts.bold,
    italics: opts.italics,
    style: opts.style,
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

  paragraphs.push(emptyLine(settings), emptyLine(settings), emptyLine(settings))

  if (titlePage.copyright) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [scriptRun(titlePage.copyright, settings)],
        spacing: { after: 120 },
      }),
    )
  }

  if (titlePage.contact) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [scriptRun(titlePage.contact, settings)],
        spacing: { after: 200 },
      }),
    )
  }

  paragraphs.push(
    emptyLine(settings),
    new Paragraph({
      children: [new PageBreak()],
    }),
  )

  return paragraphs
}

function buildCastPageParagraphs(
  members: ReturnType<typeof mergeCastWithDetected>,
  settings: FormatSettings,
): Paragraph[] {
  const paragraphs: Paragraph[] = [
    emptyLine(settings),
    emptyLine(settings),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        scriptRun('CAST OF CHARACTERS', settings, { bold: true, italics: false }),
      ],
      spacing: { after: 300 },
    }),
  ]

  for (const member of members) {
    paragraphs.push(
      new Paragraph({
        indent: { left: convertInchesToTwip(settings.marginLeft) },
        children: [scriptRun(formatCastEntry(member), settings)],
        spacing: { after: 80 },
      }),
    )
  }

  paragraphs.push(
    emptyLine(settings),
    new Paragraph({ children: [new PageBreak()] }),
  )

  return paragraphs
}

function stageDirectionItalic(settings: FormatSettings): boolean {
  return settings.stageDirectionStyle !== 'plain'
}

function elementToParagraphs(
  el: ScriptElement,
  settings: FormatSettings,
  characterNames: string[] = [],
): Paragraph[] {
  const inch = convertInchesToTwip

  const capitalizeDirection = (text: string) => {
    let result = text
    for (const name of characterNames) {
      result = result.replace(new RegExp(`\\b${name}\\b`, 'gi'), name)
    }
    return result
  }

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
          indent: { left: inch(settings.stageDirectionIndent) },
          children: [
            scriptRun(
              formatStageDirection(
                capitalizeDirection(el.text),
                settings.stageDirectionStyle,
              ),
              settings,
              {
                italics: stageDirectionItalic(settings),
                style: STYLE_NAMES.direction,
              },
            ),
          ],
          spacing: { after: 200 },
        }),
      ]
    case 'character': {
      const paras: Paragraph[] = [
        new Paragraph({
          indent: { left: inch(settings.characterIndent) },
          children: [
            scriptRun(el.text.toUpperCase(), settings, {
              bold: true,
              style: STYLE_NAMES.character,
            }),
          ],
          spacing: {
            before: 240,
            after: settings.doubleSpaceAfterCharacter ? 120 : 0,
          },
        }),
      ]
      if (el.dualCharacter) {
        paras.push(
          new Paragraph({
            indent: { left: inch(settings.characterIndent) },
            children: [
              scriptRun(el.dualCharacter.toUpperCase(), settings, {
                bold: true,
                style: STYLE_NAMES.character,
              }),
            ],
            spacing: { after: settings.doubleSpaceAfterCharacter ? 120 : 0 },
          }),
        )
      }
      return paras
    }
    case 'parenthetical':
      return [
        new Paragraph({
          indent: { left: inch(settings.parentheticalIndent) },
          children: [
            scriptRun(`(${el.text})`, settings, {
              italics: true,
              style: STYLE_NAMES.parenthetical,
            }),
          ],
          spacing: { after: 60 },
        }),
      ]
    case 'dialogue': {
      const paras = el.text.split('\n').map(
        (line) =>
          new Paragraph({
            indent: { left: inch(settings.dialogueIndent) },
            children: [
              scriptRun(line, settings, { style: STYLE_NAMES.dialogue }),
            ],
            spacing: { after: 60 },
          }),
      )
      if (el.dualDialogue) {
        paras.push(
          ...el.dualDialogue.split('\n').map(
            (line) =>
              new Paragraph({
                indent: { left: inch(settings.dialogueIndent + 1) },
                children: [
                  scriptRun(line, settings, { style: STYLE_NAMES.dialogue }),
                ],
                spacing: { after: 60 },
              }),
          ),
        )
      }
      return paras
    }
    case 'lyrics':
      return el.text.split('\n').map(
        (line) =>
          new Paragraph({
            indent: { left: inch(settings.dialogueIndent + 0.5) },
            children: [
              scriptRun(
                settings.lyricsStyle === 'uppercase' ? line.toUpperCase() : line,
                settings,
                { bold: settings.lyricsStyle === 'uppercase' },
              ),
            ],
            spacing: { after: 60 },
          }),
      )
    case 'song_heading':
      return [
        emptyLine(settings),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            scriptRun(`"${el.text}"`, settings, { bold: true, italics: true }),
          ],
          spacing: { after: 200 },
        }),
      ]
    case 'stage_direction':
      return [
        new Paragraph({
          indent: { left: inch(settings.stageDirectionIndent) },
          children: [
            scriptRun(
              formatStageDirection(
                capitalizeDirection(el.text),
                settings.stageDirectionStyle,
              ),
              settings,
              {
                italics: stageDirectionItalic(settings),
                style: STYLE_NAMES.direction,
              },
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
  castMetadata: CastMetadata = {},
): Promise<Blob> {
  const { elements, mergedSettings, bodyElements } = getScriptSections(raw, settings)
  const characterNames = collectCharacterNames(elements)
  const castMembers = mergeCastWithDetected(characterNames, castMetadata)
  const children: Paragraph[] = []

  if (mergedSettings.showTitlePage) {
    children.push(...buildTitlePageParagraphs(mergedSettings))
  }

  if (mergedSettings.showCastPage && castMembers.length > 0) {
    children.push(...buildCastPageParagraphs(castMembers, mergedSettings))
  }

  for (const el of bodyElements) {
    children.push(...elementToParagraphs(el, mergedSettings, characterNames))
    if (el.type === 'character' && el.dualCharacter && el.dualDialogue) {
      children.push(
        ...elementToParagraphs(
          { ...el, type: 'dialogue', text: el.dualDialogue },
          mergedSettings,
          characterNames,
        ),
      )
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(mergedSettings.marginTop),
              right: convertInchesToTwip(mergedSettings.marginRight),
              bottom: convertInchesToTwip(mergedSettings.marginBottom),
              left: convertInchesToTwip(mergedSettings.marginLeft),
            },
          },
        },
        headers: mergedSettings.includePageNumbers
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    children: [
                      scriptRun(mergedSettings.titlePage.title, mergedSettings),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        footers: mergedSettings.includePageNumbers
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      scriptRun('', mergedSettings),
                      new TextRun({
                        children: [PageNumber.CURRENT],
                        font: SCRIPT_FONT,
                        size: ptToHalfPoints(mergedSettings.fontSize),
                      }),
                      scriptRun('.', mergedSettings),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        children,
      },
    ],
  })

  return Packer.toBlob(doc)
}

export async function downloadScriptDocx(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
  castMetadata: CastMetadata = {},
): Promise<void> {
  const blob = await buildScriptDocx(raw, settings, castMetadata)
  const name = sanitizeFilename(settings.titlePage.title || 'play-script')
  downloadBlob(
    blob,
    `${name}.docx`,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  )
}
