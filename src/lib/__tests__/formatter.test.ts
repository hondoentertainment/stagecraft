import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, SAMPLE_SCRIPT } from '../../types/script'
import { formatScript } from '../formatter'

describe('formatScript', () => {
  it('produces formatted plain text', () => {
    const result = formatScript(SAMPLE_SCRIPT, DEFAULT_SETTINGS)
    expect(result.plainText).toContain('ACT I')
    expect(result.plainText).toContain('MARCUS')
    expect(result.plainText.length).toBeGreaterThan(100)
  })

  it('includes page count and runtime', () => {
    const result = formatScript(SAMPLE_SCRIPT, DEFAULT_SETTINGS)
    expect(result.pageCount).toBeGreaterThan(0)
    expect(result.estimatedRuntimeMinutes).toBeGreaterThan(0)
  })

  it('warns when act/scene headings are missing', () => {
    const raw = `MARCUS
Hello there.`
    const result = formatScript(raw, DEFAULT_SETTINGS)
    expect(result.warnings.some((w) => w.message.includes('act or scene'))).toBe(true)
  })

  it('respects title page setting', () => {
    const withTitle = formatScript(SAMPLE_SCRIPT, {
      ...DEFAULT_SETTINGS,
      showTitlePage: true,
      titlePage: { ...DEFAULT_SETTINGS.titlePage, title: 'Test Play' },
    })
    expect(withTitle.plainText).toContain('TEST PLAY')

    const noTitle = formatScript(SAMPLE_SCRIPT, {
      ...DEFAULT_SETTINGS,
      showTitlePage: false,
    })
    expect(noTitle.plainText.indexOf('TEST PLAY')).toBe(-1)
  })
})
