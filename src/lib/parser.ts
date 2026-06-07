import type { ScriptElement, ScriptElementType } from '../types/script'

const ACT_PATTERN =
  /^(?:ACT|Act)\s+([IVXLC]+|\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\w+)\s*(?:[-–—:]\s*)?(.*)?$/i

const SCENE_PATTERN =
  /^(?:SCENE|Scene)\s+([IVXLC]+|\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\w+)\s*(?:[-–—:]\s*)?(.*)?$/i

const ACT_SCENE_COMBINED =
  /^(?:ACT|Act)\s+([IVXLC]+|\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\w+)\s+(?:SCENE|Scene)\s+([IVXLC]+|\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\w+)\s*(?:[-–—:]\s*)?(.*)?$/i

const CHARACTER_PATTERN = /^([A-Z][A-Z0-9\s.'\-()]+?)(?:\s*\(([^)]+)\))?\s*$/

const TRANSITION_PATTERN =
  /^(FADE IN\.?|FADE OUT\.?|CUT TO\.?|DISSOLVE TO\.?|SMASH CUT\.?|END OF (?:ACT|SCENE|PLAY)\.?|THE END\.?|BLACKOUT\.?|CURTAIN\.?)$/i

const BYLINE_PATTERN = /^(?:by|written by|a play by)\s+(.+)/i

function isLikelyCharacter(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length > 40) return false
  if (!/^[A-Z]/.test(trimmed)) return false
  if (/[.!?]$/.test(trimmed) && !/\([^)]*\)/.test(trimmed)) return false
  if (/^(INT\.|EXT\.|INT\/EXT\.)/i.test(trimmed)) return false
  if (ACT_PATTERN.test(trimmed) || SCENE_PATTERN.test(trimmed)) return false
  if (TRANSITION_PATTERN.test(trimmed)) return false

  const withoutParen = trimmed.replace(/\([^)]*\)/g, '').trim()
  if (!withoutParen) return false

  const alphaRatio =
    (withoutParen.match(/[A-Za-z]/g)?.length ?? 0) / withoutParen.length
  return alphaRatio > 0.6 && /^[A-Z0-9\s.'\-()]+$/.test(trimmed)
}

function isStageDirection(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (/^\(.+\)$/.test(trimmed)) return false
  if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i.test(trimmed)) return true
  if (/^\[.+\]$/.test(trimmed)) return true
  if (/^(?:The |A |An |We |He |She |They |It )/.test(trimmed)) return true
  if (/ enters\.?$| exits\.?$| crosses\.?$| sits\.?$| stands\.?$/i.test(trimmed))
    return true
  return false
}

function isParenthetical(line: string): boolean {
  const trimmed = line.trim()
  return /^\([^)]+\)\.?$/.test(trimmed)
}

function normalizeActScene(
  actNum: string,
  sceneNum?: string,
  remainder?: string,
): { act?: ScriptElement; scene?: ScriptElement; setting?: ScriptElement } {
  const result: {
    act?: ScriptElement
    scene?: ScriptElement
    setting?: ScriptElement
  } = {}

  if (actNum) {
    result.act = { type: 'act', text: actNum.toUpperCase(), lineNumber: 0 }
  }
  if (sceneNum) {
    result.scene = { type: 'scene', text: sceneNum.toUpperCase(), lineNumber: 0 }
  }
  if (remainder?.trim()) {
    result.setting = {
      type: 'setting',
      text: remainder.trim(),
      lineNumber: 0,
    }
  }
  return result
}

export function parseScript(raw: string): ScriptElement[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const elements: ScriptElement[] = []
  let pendingCharacter: string | null = null
  let titleCaptured = false
  let authorCaptured = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const lineNumber = i + 1

    if (!trimmed) {
      elements.push({ type: 'blank', text: '', lineNumber })
      pendingCharacter = null
      continue
    }

    const byMatch = trimmed.match(BYLINE_PATTERN)
    if (byMatch && !authorCaptured) {
      elements.push({ type: 'author', text: byMatch[1].trim(), lineNumber })
      authorCaptured = true
      continue
    }

    const combinedMatch = trimmed.match(ACT_SCENE_COMBINED)
    if (combinedMatch) {
      const { act, scene, setting } = normalizeActScene(
        combinedMatch[1],
        combinedMatch[2],
        combinedMatch[3],
      )
      if (act) elements.push({ ...act, lineNumber })
      if (scene) elements.push({ ...scene, lineNumber })
      if (setting) elements.push({ ...setting, lineNumber })
      pendingCharacter = null
      continue
    }

    const actMatch = trimmed.match(ACT_PATTERN)
    if (actMatch && !trimmed.match(/^SCENE/i)) {
      elements.push({ type: 'act', text: actMatch[1].toUpperCase(), lineNumber })
      if (actMatch[2]?.trim()) {
        elements.push({
          type: 'setting',
          text: actMatch[2].trim(),
          lineNumber,
        })
      }
      pendingCharacter = null
      continue
    }

    const sceneMatch = trimmed.match(SCENE_PATTERN)
    if (sceneMatch) {
      elements.push({
        type: 'scene',
        text: sceneMatch[1].toUpperCase(),
        lineNumber,
      })
      if (sceneMatch[2]?.trim()) {
        elements.push({
          type: 'setting',
          text: sceneMatch[2].trim(),
          lineNumber,
        })
      }
      pendingCharacter = null
      continue
    }

    if (TRANSITION_PATTERN.test(trimmed)) {
      elements.push({ type: 'transition', text: trimmed.toUpperCase(), lineNumber })
      pendingCharacter = null
      continue
    }

    if (isParenthetical(trimmed)) {
      elements.push({
        type: 'parenthetical',
        text: trimmed.replace(/^\(|\)\.?$/g, ''),
        lineNumber,
      })
      continue
    }

    const charMatch = trimmed.match(CHARACTER_PATTERN)
    if (charMatch && isLikelyCharacter(trimmed)) {
      let name = charMatch[1].trim()
      const inlineParen = charMatch[2]
      if (inlineParen) {
        name = `${name} (${inlineParen})`
      }
      elements.push({ type: 'character', text: name, lineNumber })
      pendingCharacter = name
      continue
    }

    if (pendingCharacter) {
      elements.push({ type: 'dialogue', text: trimmed, lineNumber })
      continue
    }

    if (isStageDirection(trimmed)) {
      elements.push({ type: 'stage_direction', text: trimmed, lineNumber })
      pendingCharacter = null
      continue
    }

    if (!titleCaptured && elements.filter((e) => e.type !== 'blank').length === 0) {
      elements.push({ type: 'title', text: trimmed, lineNumber })
      titleCaptured = true
      continue
    }

    if (
      !authorCaptured &&
      titleCaptured &&
      elements.some((e) => e.type === 'title') &&
      !elements.some((e) => e.type === 'act' || e.type === 'scene')
    ) {
      const lastNonBlank = [...elements].reverse().find((e) => e.type !== 'blank')
      if (lastNonBlank?.type === 'title') {
        elements.push({ type: 'subtitle', text: trimmed, lineNumber })
        continue
      }
    }

    elements.push({ type: 'stage_direction', text: trimmed, lineNumber })
    pendingCharacter = null
  }

  return elements
}

export function mergeDialogueLines(elements: ScriptElement[]): ScriptElement[] {
  const merged: ScriptElement[] = []

  for (const el of elements) {
    const prev = merged[merged.length - 1]
    if (el.type === 'dialogue' && prev?.type === 'dialogue') {
      prev.text = `${prev.text}\n${el.text}`
    } else {
      merged.push({ ...el })
    }
  }

  return merged
}

export function getElementLabel(type: ScriptElementType): string {
  const labels: Record<ScriptElementType, string> = {
    title: 'Title',
    subtitle: 'Subtitle',
    author: 'Author',
    act: 'Act',
    scene: 'Scene',
    setting: 'Setting',
    character: 'Character',
    parenthetical: 'Parenthetical',
    dialogue: 'Dialogue',
    stage_direction: 'Stage Direction',
    transition: 'Transition',
    blank: 'Blank',
  }
  return labels[type]
}
