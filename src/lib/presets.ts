import type { FormatPresetId, FormatSettings } from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'

export interface FormatPreset {
  id: FormatPresetId
  label: string
  description: string
  settings: Partial<FormatSettings>
}

export const FORMAT_PRESETS: FormatPreset[] = [
  {
    id: 'us-stage',
    label: 'US Stage Play',
    description: 'Samuel French standard — 1.5" left margin, Roman numerals',
    settings: {
      formatPreset: 'us-stage',
      actSceneStyle: 'roman',
      characterIndent: 3.5,
      dialogueIndent: 2.5,
      parentheticalIndent: 2,
      marginLeft: 1.5,
      marginRight: 1,
      linesPerPage: 54,
      stageDirectionStyle: 'italic',
      doubleSpaceAfterCharacter: true,
      includePageNumbers: true,
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
      marginLeft: 1.75,
      marginRight: 1,
      linesPerPage: 54,
      stageDirectionStyle: 'italic',
      doubleSpaceAfterCharacter: true,
      includePageNumbers: true,
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
      dialogueIndent: 2.5,
      parentheticalIndent: 2,
      marginLeft: 1.5,
      marginRight: 1,
      linesPerPage: 54,
      stageDirectionStyle: 'plain',
      doubleSpaceAfterCharacter: false,
      includePageNumbers: true,
    },
  },
  {
    id: 'musical',
    label: 'Musical',
    description: 'Lyric blocks and song headings for musical theatre',
    settings: {
      formatPreset: 'musical',
      actSceneStyle: 'roman',
      characterIndent: 3.5,
      dialogueIndent: 2.5,
      parentheticalIndent: 2,
      marginLeft: 1.5,
      marginRight: 1,
      linesPerPage: 54,
      stageDirectionStyle: 'italic',
      doubleSpaceAfterCharacter: true,
      includePageNumbers: true,
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
