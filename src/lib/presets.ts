import type { FormatPresetId, FormatSettings } from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'
import { DRAMATISTS_GUILD_SPEC } from './dramatistsGuild'

export interface FormatPreset {
  id: FormatPresetId
  label: string
  description: string
  settings: Partial<FormatSettings>
}

export const FORMAT_PRESETS: FormatPreset[] = [
  {
    id: 'dramatists-guild',
    label: 'Dramatists Guild',
    description:
      'DG standard — Courier 12pt, 1.5" binding margin, parenthetical stage directions, cast page',
    settings: DRAMATISTS_GUILD_SPEC,
  },
  {
    id: 'us-stage',
    label: 'US Stage Play',
    description: 'Samuel French style — Roman numerals, italic stage directions',
    settings: {
      formatPreset: 'us-stage',
      actSceneStyle: 'roman',
      characterIndent: 3.5,
      dialogueIndent: 2.5,
      parentheticalIndent: 2,
      stageDirectionIndent: 1.5,
      marginLeft: 1.5,
      marginRight: 1,
      linesPerPage: 54,
      stageDirectionStyle: 'italic',
      doubleSpaceAfterCharacter: true,
      includePageNumbers: true,
      showCastPage: false,
      lyricsStyle: 'normal',
      pageNumberStartsAt: 1,
    },
  },
  {
    id: 'uk-stage',
    label: 'UK Stage Play',
    description: 'British theatre layout — wider left binding margin',
    settings: {
      formatPreset: 'uk-stage',
      actSceneStyle: 'arabic',
      characterIndent: 4,
      dialogueIndent: 2.75,
      parentheticalIndent: 2.25,
      stageDirectionIndent: 1.75,
      marginLeft: 1.75,
      marginRight: 1,
      linesPerPage: 54,
      stageDirectionStyle: 'italic',
      doubleSpaceAfterCharacter: true,
      includePageNumbers: true,
      showCastPage: false,
      lyricsStyle: 'normal',
      pageNumberStartsAt: 1,
    },
  },
  {
    id: 'one-act',
    label: 'One-Act Play',
    description: 'Simplified structure for short works',
    settings: {
      formatPreset: 'one-act',
      actSceneStyle: 'arabic',
      characterIndent: 3.5,
      dialogueIndent: 1.5,
      parentheticalIndent: 1.5,
      stageDirectionIndent: 1.5,
      marginLeft: 1.5,
      marginRight: 1,
      linesPerPage: 54,
      stageDirectionStyle: 'parentheses',
      doubleSpaceAfterCharacter: false,
      includePageNumbers: true,
      showCastPage: false,
      lyricsStyle: 'normal',
      pageNumberStartsAt: 1,
    },
  },
  {
    id: 'musical',
    label: 'Musical (DG)',
    description: 'Dramatists Guild musical — ALL CAPS lyrics, cast page, song headings',
    settings: {
      ...DRAMATISTS_GUILD_SPEC,
      formatPreset: 'musical',
    },
  },
]

export function applyPreset(
  presetId: FormatPresetId,
  current: FormatSettings,
): FormatSettings {
  if (presetId === 'custom') return current
  const preset = FORMAT_PRESETS.find((p) => p.id === presetId)
  if (!preset) return current
  return { ...current, ...preset.settings, formatPreset: presetId }
}

export function detectPreset(settings: FormatSettings): FormatPresetId {
  for (const preset of FORMAT_PRESETS) {
    const match = Object.entries(preset.settings).every(([key, value]) => {
      if (key === 'formatPreset') return true
      return settings[key as keyof FormatSettings] === value
    })
    if (match) return preset.id
  }
  return 'custom'
}

export function getPresetSettings(presetId: FormatPresetId): FormatSettings {
  const preset = FORMAT_PRESETS.find((p) => p.id === presetId)
  return { ...DEFAULT_SETTINGS, ...preset?.settings, formatPreset: presetId }
}
