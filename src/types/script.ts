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
}

export type FormatPresetId =
  | 'us-stage'
  | 'uk-stage'
  | 'one-act'
  | 'musical'
  | 'custom'

export interface FormatSettings {
  titlePage: TitlePageInfo
  showTitlePage: boolean
  fontSize: number
  dialogueIndent: number
  characterIndent: number
  parentheticalIndent: number
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
}

export interface FormattedScript {
  elements: ScriptElement[]
  plainText: string
  warnings: string[]
  pageCount: number
  estimatedRuntimeMinutes: number
}

export interface ScriptProject {
  id: string
  name: string
  rawScript: string
  settings: FormatSettings
  typeOverrides: Record<number, ScriptElementType>
  updatedAt: number
}

export type TypeOverrides = Record<number, ScriptElementType>

export const DEFAULT_SETTINGS: FormatSettings = {
  titlePage: {
    title: 'Untitled Play',
    subtitle: '',
    author: '',
    contact: '',
  },
  showTitlePage: true,
  fontSize: 12,
  dialogueIndent: 2.5,
  characterIndent: 3.5,
  parentheticalIndent: 2,
  stageDirectionStyle: 'italic',
  actSceneStyle: 'roman',
  includePageNumbers: true,
  doubleSpaceAfterCharacter: true,
  formatPreset: 'us-stage',
  synopsis: '',
  linesPerPage: 54,
  marginLeft: 1.5,
  marginRight: 1,
  marginTop: 1,
  marginBottom: 1,
}

export const SAMPLE_SCRIPT = `THE LAST TRAIN

By Jane Morrison

Act 1 Scene 1

A dimly lit subway platform. Late night. A single fluorescent bulb flickers.

MARCUS enters, checking his phone.

MARCUS
(looking up)
Is this the right platform?

An announcement crackles overhead.

VOICE (V.O.)
The last train has departed.

Marcus slumps onto a bench.

MARCUS (CONT'D)
Then I guess I'm walking.

SONG: "Midnight Walk"

~Walking down the empty street
~No one left to meet

He exits.

END OF SCENE`
