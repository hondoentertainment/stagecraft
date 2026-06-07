import type { FormatSettings, ScriptElement } from '../types/script'
import { countFrontMatterPages, estimatePageCount, estimateRuntimeMinutes } from './pagination'

export interface CharacterReport {
  name: string
  lineCount: number
  wordCount: number
}

export interface SceneReport {
  act: string
  scene: string
  setting: string
  characters: string[]
  lineNumber: number
}

export interface ScriptReport {
  characters: CharacterReport[]
  scenes: SceneReport[]
  pageCount: number
  runtimeMinutes: number
  totalDialogueLines: number
}

function normalizeCharacterName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*/g, '').trim().toUpperCase()
}

export function generateScriptReport(
  elements: ScriptElement[],
  settings: FormatSettings,
): ScriptReport {
  const charMap = new Map<string, CharacterReport>()
  const scenes: SceneReport[] = []

  let currentAct = ''
  let currentScene = ''
  let currentSetting = ''
  let sceneCharacters = new Set<string>()
  let sceneStartLine = 0
  let currentCharacter = ''
  let totalDialogueLines = 0

  const bodyElements = elements.filter(
    (e) => !['title', 'subtitle', 'author', 'blank'].includes(e.type),
  )

  function flushScene() {
    if (currentScene || currentAct) {
      scenes.push({
        act: currentAct,
        scene: currentScene,
        setting: currentSetting,
        characters: [...sceneCharacters].sort(),
        lineNumber: sceneStartLine,
      })
    }
    sceneCharacters = new Set()
  }

  for (const el of bodyElements) {
    if (el.type === 'act') {
      flushScene()
      currentAct = el.text
      currentScene = ''
      currentSetting = ''
      sceneStartLine = el.lineNumber
    } else if (el.type === 'scene') {
      flushScene()
      currentScene = el.text
      currentSetting = ''
      sceneStartLine = el.lineNumber
    } else if (el.type === 'setting') {
      currentSetting = el.text
    } else if (el.type === 'character') {
      currentCharacter = normalizeCharacterName(el.text)
      sceneCharacters.add(currentCharacter)
      const key = currentCharacter
      const existing = charMap.get(key) ?? {
        name: key,
        lineCount: 0,
        wordCount: 0,
      }
      charMap.set(key, existing)
    } else if (el.type === 'dialogue' && currentCharacter) {
      totalDialogueLines++
      const key = currentCharacter
      const existing = charMap.get(key) ?? {
        name: key,
        lineCount: 0,
        wordCount: 0,
      }
      const words = el.text.split(/\s+/).filter(Boolean).length
      charMap.set(key, {
        ...existing,
        lineCount: existing.lineCount + el.text.split('\n').length,
        wordCount: existing.wordCount + words,
      })
      sceneCharacters.add(key)
    }
  }

  flushScene()

  const pageCount = estimatePageCount(bodyElements, settings)
  const runtimeMinutes = estimateRuntimeMinutes(
    pageCount,
    countFrontMatterPages(settings) > 0,
  )

  return {
    characters: [...charMap.values()].sort((a, b) => b.lineCount - a.lineCount),
    scenes,
    pageCount,
    runtimeMinutes,
    totalDialogueLines,
  }
}

export function formatCharacterListReport(report: ScriptReport): string {
  const lines = ['CAST OF CHARACTERS', '', '='.repeat(40), '']
  for (const char of report.characters) {
    lines.push(
      `${char.name.padEnd(24)} ${char.lineCount} lines  (${char.wordCount} words)`,
    )
  }
  lines.push('', `Total speaking roles: ${report.characters.length}`)
  return lines.join('\n')
}

export function formatSceneBreakdownReport(report: ScriptReport): string {
  const lines = ['SCENE BREAKDOWN', '', '='.repeat(40), '']
  for (const scene of report.scenes) {
    const label = [
      scene.act ? `Act ${scene.act}` : '',
      scene.scene ? `Scene ${scene.scene}` : '',
    ]
      .filter(Boolean)
      .join(' — ')
    lines.push(label || `Scene at line ${scene.lineNumber}`)
    if (scene.setting) lines.push(`  Setting: ${scene.setting}`)
    if (scene.characters.length) {
      lines.push(`  Characters: ${scene.characters.join(', ')}`)
    }
    lines.push('')
  }
  lines.push(`Total scenes: ${report.scenes.length}`)
  lines.push(`Estimated pages: ${report.pageCount}`)
  lines.push(`Estimated runtime: ~${report.runtimeMinutes} minutes`)
  return lines.join('\n')
}
