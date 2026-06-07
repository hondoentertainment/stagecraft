import { describe, expect, it } from 'vitest'
import { SAMPLE_SCRIPT } from '../../types/script'
import {
  applyTypeOverrides,
  mergeDialogueLines,
  parseScript,
} from '../parser'

describe('parseScript', () => {
  it('parses sample script elements', () => {
    const elements = mergeDialogueLines(parseScript(SAMPLE_SCRIPT))
    const types = elements.map((e) => e.type)

    expect(types).toContain('title')
    expect(types).toContain('author')
    expect(types).toContain('act')
    expect(types).toContain('scene')
    expect(types).toContain('character')
    expect(types).toContain('dialogue')
    expect(types).toContain('parenthetical')
    expect(types).toContain('stage_direction')
    expect(types).toContain('song_heading')
    expect(types).toContain('lyrics')
  })

  it('detects character modifiers', () => {
    const raw = `ACT 1

MARCUS
Hello.

VOICE (V.O.)
Offstage line.`

    const elements = parseScript(raw)
    const voice = elements.find((e) => e.type === 'character' && e.text.includes('V.O.'))
    expect(voice).toBeDefined()
  })

  it('detects CONT\'D character cues', () => {
    const raw = `MARCUS (CONT'D)
More dialogue.`

    const elements = parseScript(raw)
    expect(elements.some((e) => e.type === 'character' && e.text.includes("CONT'D"))).toBe(
      true,
    )
  })

  it('detects transitions', () => {
    const raw = `FADE OUT.`
    const elements = parseScript(raw)
    expect(elements[0].type).toBe('transition')
  })

  it('merges consecutive dialogue lines', () => {
    const raw = `MARCUS
Line one.
Line two.`

    const elements = mergeDialogueLines(parseScript(raw))
    const dialogue = elements.find((e) => e.type === 'dialogue')
    expect(dialogue?.text).toBe('Line one.\nLine two.')
  })
})

describe('applyTypeOverrides', () => {
  it('overrides element type by line number', () => {
    const elements = parseScript('Marcus exits.\n\nMARCUS\nHi.')
    const overridden = applyTypeOverrides(elements, { 1: 'dialogue' })
    expect(overridden[0].type).toBe('dialogue')
  })
})
