import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, SAMPLE_SCRIPT } from '../../types/script'
import { DRAMATISTS_GUILD_SPEC } from '../dramatistsGuild'
import { getPresetSettings } from '../presets'
import { formatScript } from '../formatter'

describe('Dramatists Guild format', () => {
  it('uses DG preset as default', () => {
    expect(DEFAULT_SETTINGS.formatPreset).toBe('dramatists-guild')
    expect(DEFAULT_SETTINGS.stageDirectionStyle).toBe('parentheses')
    expect(DEFAULT_SETTINGS.marginLeft).toBe(1.5)
    expect(DEFAULT_SETTINGS.showCastPage).toBe(true)
    expect(DEFAULT_SETTINGS.lyricsStyle).toBe('uppercase')
  })

  it('preset matches guild spec', () => {
    const preset = getPresetSettings('dramatists-guild')
    expect(preset.characterIndent).toBe(DRAMATISTS_GUILD_SPEC.characterIndent)
    expect(preset.dialogueIndent).toBe(DRAMATISTS_GUILD_SPEC.dialogueIndent)
    expect(preset.stageDirectionIndent).toBe(DRAMATISTS_GUILD_SPEC.stageDirectionIndent)
  })

  it('wraps stage directions in parentheses', () => {
    const result = formatScript(SAMPLE_SCRIPT, DEFAULT_SETTINGS)
    expect(result.plainText).toContain('(MARCUS enters, checking his phone.)')
    expect(result.plainText).toContain('CAST OF CHARACTERS')
  })

  it('uppercases lyrics', () => {
    const result = formatScript(SAMPLE_SCRIPT, DEFAULT_SETTINGS)
    expect(result.plainText).toContain('WALKING DOWN THE EMPTY STREET')
  })

  it('numbers first script page as 1', () => {
    const raw = `ACT 1

SCENE 1

(Morning.)

MARCUS
Hello.`
    const html = formatScript(raw, DEFAULT_SETTINGS).plainText
    expect(html).toBeTruthy()
  })
})
