import type { FormatSettings, ScriptElement } from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'
import { formatNumber } from './formatter'
import { getScriptSections } from './formatter'
import { downloadText, sanitizeFilename } from './export'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function paragraph(type: string, text: string): string {
  return `    <Paragraph Type="${type}"><Text>${escapeXml(text)}</Text></Paragraph>`
}

function elementToFdx(el: ScriptElement, settings: FormatSettings): string[] {
  switch (el.type) {
    case 'act':
      return [
        paragraph(
          'Scene Heading',
          `ACT ${formatNumber(el.text, settings.actSceneStyle)}`,
        ),
      ]
    case 'scene':
      return [
        paragraph(
          'Scene Heading',
          `SCENE ${formatNumber(el.text, settings.actSceneStyle)}`,
        ),
      ]
    case 'setting':
      return [paragraph('Action', el.text)]
    case 'character':
      return [paragraph('Character', el.text.toUpperCase())]
    case 'parenthetical':
      return [paragraph('Parenthetical', `(${el.text})`)]
    case 'dialogue':
      return el.text.split('\n').map((line) => paragraph('Dialogue', line))
    case 'lyrics':
      return el.text.split('\n').map((line) => paragraph('Lyrics', line))
    case 'song_heading':
      return [paragraph('Action', `SONG: "${el.text}"`)]
    case 'stage_direction':
      return [paragraph('Action', el.text)]
    case 'transition':
      return [paragraph('Transition', el.text.toUpperCase())]
    default:
      return []
  }
}

export function scriptToFdx(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): string {
  const { mergedSettings, bodyElements } = getScriptSections(raw, settings)

  const paragraphs = bodyElements.flatMap((el) =>
    elementToFdx(el, mergedSettings),
  )

  return `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="Screenplay" Version="1">
  <Content>
${paragraphs.join('\n')}
  </Content>
</FinalDraft>`
}

export function downloadFdx(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): void {
  const content = scriptToFdx(raw, settings)
  const name = sanitizeFilename(settings.titlePage.title || 'play-script')
  downloadText(content, `${name}.fdx`)
}
