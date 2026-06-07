import type { FormatSettings, ScriptElement } from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'
import { formatNumber } from './formatter'
import { getScriptSections } from './formatter'
import { downloadText, sanitizeFilename } from './export'

function elementToFountain(el: ScriptElement, settings: FormatSettings): string[] {
  switch (el.type) {
    case 'act':
      return [`# ACT ${formatNumber(el.text, settings.actSceneStyle)}`, '']
    case 'scene':
      return [`# SCENE ${formatNumber(el.text, settings.actSceneStyle)}`, '']
    case 'setting':
      return [el.text, '']
    case 'character': {
      const lines = [el.text.toUpperCase()]
      if (el.dualCharacter) lines.push(`${el.dualCharacter.toUpperCase()}^`)
      return lines
    }
    case 'parenthetical':
      return [`(${el.text})`]
    case 'dialogue': {
      const lines = el.text.split('\n')
      if (el.dualDialogue) lines.push(el.dualDialogue)
      return lines
    }
    case 'lyrics':
      return el.text.split('\n').map((l) => `~${l}`)
    case 'song_heading':
      return [`SONG: "${el.text}"`, '']
    case 'stage_direction':
      return [el.text, '']
    case 'transition':
      return ['', `> ${el.text.toUpperCase()}`, '']
    default:
      return []
  }
}

export function scriptToFountain(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): string {
  const { mergedSettings, bodyElements } = getScriptSections(raw, settings)
  const lines: string[] = []

  lines.push(`Title: ${mergedSettings.titlePage.title}`)
  if (mergedSettings.titlePage.author) {
    lines.push(`Author: ${mergedSettings.titlePage.author}`)
  }
  lines.push('')

  for (const el of bodyElements) {
    lines.push(...elementToFountain(el, mergedSettings))
  }

  return lines.join('\n')
}

export function downloadFountain(
  raw: string,
  settings: FormatSettings = DEFAULT_SETTINGS,
): void {
  const content = scriptToFountain(raw, settings)
  const name = sanitizeFilename(settings.titlePage.title || 'play-script')
  downloadText(content, `${name}.fountain`)
}
