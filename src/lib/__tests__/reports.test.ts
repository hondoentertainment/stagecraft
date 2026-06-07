import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, SAMPLE_SCRIPT } from '../../types/script'
import { formatScript } from '../formatter'
import { generateScriptReport } from '../reports'

describe('generateScriptReport', () => {
  it('generates character and scene reports', () => {
    const formatted = formatScript(SAMPLE_SCRIPT, DEFAULT_SETTINGS)
    const report = generateScriptReport(formatted.elements, DEFAULT_SETTINGS)

    expect(report.characters.length).toBeGreaterThan(0)
    expect(report.scenes.length).toBeGreaterThan(0)
    expect(report.pageCount).toBeGreaterThan(0)
    expect(report.characters.some((c) => c.name === 'MARCUS')).toBe(true)
  })
})
