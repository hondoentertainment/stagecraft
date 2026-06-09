import type { ScriptElement, ScriptWarning } from '../types/script'

const MAX_DIALOGUE_CHARS = 35

export function collectWarnings(elements: ScriptElement[]): ScriptWarning[] {
  const warnings: ScriptWarning[] = []
  let hasCharacter = false
  let hasDialogue = false
  let orphanDialogue = 0
  let longDialogue = 0
  let sceneWithoutSetting = 0
  const characterNames = new Map<string, string>()

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]

    if (el.type === 'character') {
      hasCharacter = true
      const normalized = el.text.replace(/\s*\([^)]*\)/g, '').trim()
      const upper = normalized.toUpperCase()
      if (normalized !== upper) {
        warnings.push({
          id: `lower-${el.lineNumber}`,
          message: `Character "${el.text}" is not ALL CAPS.`,
          lineNumber: el.lineNumber,
          fix: `Change to ${upper}`,
        })
      }

      const existing = characterNames.get(upper)
      if (existing && existing !== el.text) {
        warnings.push({
          id: `inconsistent-${el.lineNumber}`,
          message: `Inconsistent character name: "${existing}" vs "${el.text}".`,
          lineNumber: el.lineNumber,
          fix: `Standardize to ${upper}`,
        })
      }
      characterNames.set(upper, el.text)
    }

    if (el.type === 'dialogue') {
      hasDialogue = true
      const prev = elements
        .slice(0, i)
        .reverse()
        .find((e) => e.type !== 'blank')
      if (prev?.type !== 'character' && prev?.type !== 'parenthetical') {
        orphanDialogue++
        warnings.push({
          id: `orphan-${el.lineNumber}`,
          message: 'Dialogue without a character cue above it.',
          lineNumber: el.lineNumber,
          fix: 'Add an ALL CAPS character name on the line before this dialogue.',
        })
      }
      for (const line of el.text.split('\n')) {
        if (line.length > MAX_DIALOGUE_CHARS) {
          longDialogue++
          warnings.push({
            id: `long-${el.lineNumber}`,
            message: `Dialogue line exceeds ~${MAX_DIALOGUE_CHARS} characters.`,
            lineNumber: el.lineNumber,
            fix: 'Break this line into shorter sentences.',
          })
        }
      }
    }

    if (el.type === 'scene') {
      const next = elements.slice(i + 1).find((e) => e.type !== 'blank')
      if (next?.type !== 'setting' && next?.type !== 'stage_direction') {
        sceneWithoutSetting++
        warnings.push({
          id: `scene-setting-${el.lineNumber}`,
          message: 'Scene heading lacks a setting line.',
          lineNumber: el.lineNumber,
          fix: 'Add a parenthetical setting line, e.g. (A living room. Evening.)',
        })
      }
    }
  }

  if (!hasCharacter && hasDialogue) {
    warnings.push({
      id: 'no-characters',
      message: 'Dialogue found without character names — check ALL CAPS formatting.',
      fix: 'Place character names in ALL CAPS on their own line before dialogue.',
    })
  }

  if (!elements.some((e) => e.type === 'act' || e.type === 'scene')) {
    warnings.push({
      id: 'no-structure',
      message: 'No act or scene headings detected.',
      fix: 'Add ACT and SCENE markers, e.g. "Act 1 Scene 1".',
    })
  }

  if (orphanDialogue > 1) {
    const summary = warnings.find((w) => w.id.startsWith('orphan-'))
    if (!summary) {
      warnings.push({
        id: 'orphan-summary',
        message: `${orphanDialogue} dialogue block(s) may be missing character cues.`,
      })
    }
  }

  if (longDialogue > 1) {
    const hasLong = warnings.some((w) => w.id.startsWith('long-'))
    if (!hasLong) {
      warnings.push({
        id: 'long-summary',
        message: `${longDialogue} dialogue line(s) exceed recommended width.`,
      })
    }
  }

  if (sceneWithoutSetting > 1) {
    const hasScene = warnings.some((w) => w.id.startsWith('scene-setting-'))
    if (!hasScene) {
      warnings.push({
        id: 'scene-summary',
        message: `${sceneWithoutSetting} scene heading(s) lack setting lines.`,
      })
    }
  }

  const seen = new Set<string>()
  return warnings.filter((w) => {
    const key = `${w.id}-${w.lineNumber ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
