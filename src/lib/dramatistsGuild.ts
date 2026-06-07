import type { FormatSettings } from '../types/script'

/**
 * Dramatists Guild recommended play manuscript format.
 * @see https://www.dramatistsguild.com/script-formats
 * @see General SFI Formatting Guidelines (DG PDF)
 */
export const DRAMATISTS_GUILD_SPEC: Partial<FormatSettings> = {
  formatPreset: 'dramatists-guild',
  fontSize: 12,
  marginLeft: 1.5,
  marginRight: 1,
  marginTop: 1,
  marginBottom: 1,
  characterIndent: 3.5,
  dialogueIndent: 1.5,
  parentheticalIndent: 1.5,
  stageDirectionIndent: 1.5,
  stageDirectionStyle: 'parentheses',
  actSceneStyle: 'roman',
  linesPerPage: 54,
  doubleSpaceAfterCharacter: true,
  includePageNumbers: true,
  showCastPage: true,
  lyricsStyle: 'uppercase',
  pageNumberStartsAt: 1,
}

/** Usable text width: page width minus left/right indents for stage directions. */
export function stageDirectionMaxWidth(settings: FormatSettings): string {
  const width = 8.5 - settings.stageDirectionIndent - settings.marginRight
  return `${width}in`
}

export function dialogueMaxWidth(settings: FormatSettings): string {
  const width = 8.5 - settings.dialogueIndent - settings.marginRight
  return `${width}in`
}
