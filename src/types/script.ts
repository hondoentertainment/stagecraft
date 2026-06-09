export type ScriptElementType =
  | 'title'
  | 'subtitle'
  | 'author'
  | 'act'
  | 'scene'
  | 'setting'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'stage_direction'
  | 'transition'
  | 'lyrics'
  | 'song_heading'
  | 'blank'

export interface ScriptElement {
  type: ScriptElementType
  text: string
  lineNumber: number
  dualCharacter?: string
  dualDialogue?: string
}

export interface TitlePageInfo {
  title: string
  subtitle: string
  author: string
  contact: string
  copyright: string
}

export interface CastMember {
  name: string
  age: string
  gender: string
  description: string
}

export type CastMetadata = Record<string, CastMember>

export type FormatPresetId =
  | 'dramatists-guild'
  | 'us-stage'
  | 'uk-stage'
  | 'one-act'
  | 'musical'
  | 'custom'

export type LyricsStyle = 'normal' | 'uppercase'

export interface FormatSettings {
  titlePage: TitlePageInfo
  showTitlePage: boolean
  showCastPage: boolean
  fontSize: number
  dialogueIndent: number
  characterIndent: number
  parentheticalIndent: number
  stageDirectionIndent: number
  stageDirectionStyle: 'italic' | 'parentheses' | 'plain'
  actSceneStyle: 'roman' | 'arabic' | 'words'
  includePageNumbers: boolean
  doubleSpaceAfterCharacter: boolean
  formatPreset: FormatPresetId
  synopsis: string
  linesPerPage: number
  marginLeft: number
  marginRight: number
  marginTop: number
  marginBottom: number
  lyricsStyle: LyricsStyle
  pageNumberStartsAt: number
}

export interface ScriptWarning {
  id: string
  message: string
  lineNumber?: number
  fix?: string
}

export interface FormattedScript {
  elements: ScriptElement[]
  plainText: string
  warnings: ScriptWarning[]
  pageCount: number
  estimatedRuntimeMinutes: number
}

export interface ScriptProject {
  id: string
  name: string
  rawScript: string
  settings: FormatSettings
  typeOverrides: Record<number, ScriptElementType>
  castMetadata: CastMetadata
  updatedAt: number
}

export type TypeOverrides = Record<number, ScriptElementType>

export const DEFAULT_SETTINGS: FormatSettings = {
  titlePage: {
    title: 'Untitled Play',
    subtitle: '',
    author: '',
    contact: '',
    copyright: '',
  },
  showTitlePage: true,
  showCastPage: true,
  fontSize: 12,
  dialogueIndent: 1.5,
  characterIndent: 3.5,
  parentheticalIndent: 1.5,
  stageDirectionIndent: 1.5,
  stageDirectionStyle: 'parentheses',
  actSceneStyle: 'roman',
  includePageNumbers: true,
  doubleSpaceAfterCharacter: true,
  formatPreset: 'dramatists-guild',
  synopsis: '',
  linesPerPage: 54,
  marginLeft: 1.5,
  marginRight: 1,
  marginTop: 1,
  marginBottom: 1,
  lyricsStyle: 'uppercase',
  pageNumberStartsAt: 1,
}

export const SAMPLE_SCRIPT = `THE LAST TRAIN

By Jane Morrison

Act 1 Scene 1

(A dimly lit subway platform. Late night. A single fluorescent bulb flickers.)

(MARCUS enters, checking his phone.)

MARCUS
(looking up)
Is this the right platform?

(An announcement crackles overhead.)

VOICE (V.O.)
The last train has departed.

(MARCUS slumps onto a bench.)

MARCUS (CONT'D)
Then I guess I'm walking.

SONG: "Midnight Walk"

~Walking down the empty street
~No one left to meet

(MARCUS exits.)

END OF SCENE`
