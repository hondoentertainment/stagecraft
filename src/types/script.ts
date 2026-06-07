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
  | 'blank'

export interface ScriptElement {
  type: ScriptElementType
  text: string
  lineNumber: number
}

export interface TitlePageInfo {
  title: string
  subtitle: string
  author: string
  contact: string
}

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
}

export interface FormattedScript {
  elements: ScriptElement[]
  plainText: string
  warnings: string[]
}

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
  includePageNumbers: false,
  doubleSpaceAfterCharacter: true,
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

MARCUS
Then I guess I'm walking.

He exits.

End of scene`
