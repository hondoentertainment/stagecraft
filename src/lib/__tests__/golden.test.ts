import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, SAMPLE_SCRIPT } from '../../types/script'
import { formatScript, formatScriptToHtml } from '../formatter'

const __dir = dirname(fileURLToPath(import.meta.url))
const fixtureDir = join(__dir, 'fixtures')

describe('golden file output', () => {
  it('matches DG plain text fixture', () => {
    const result = formatScript(SAMPLE_SCRIPT, DEFAULT_SETTINGS)
    const expected = readFileSync(join(fixtureDir, 'sample-dg.txt'), 'utf-8')
    expect(result.plainText).toContain('CAST OF CHARACTERS')
    expect(result.plainText).toContain('(MARCUS enters, checking his phone.)')
    expect(result.plainText).toContain('ACT I')
    expect(result.plainText).toContain('WALKING DOWN THE EMPTY STREET')
    expect(result.plainText.replace(/\r\n/g, '\n')).toBe(expected.replace(/\r\n/g, '\n'))
  })

  it('matches DG HTML fixture markers', () => {
    const html = formatScriptToHtml(SAMPLE_SCRIPT, DEFAULT_SETTINGS)
    const expected = readFileSync(join(fixtureDir, 'sample-dg.html'), 'utf-8')
    expect(html).toContain('cast-page')
    expect(html).toContain('Cast of Characters')
    expect(html).toContain('class="direction"')
    expect(html).toContain(expected.trim())
  })
})
