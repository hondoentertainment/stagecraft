import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { importScriptFile } from '../importScript'

const __dir = dirname(fileURLToPath(import.meta.url))
const fixtureDir = join(__dir, 'fixtures')

function fileFromFixture(name: string, type: string): File {
  const buffer = readFileSync(join(fixtureDir, name))
  return new File([buffer], name, { type })
}

describe('importScriptFile fixtures', () => {
  it('imports fountain fixture', async () => {
    const result = await importScriptFile(fileFromFixture('sample.fountain', 'text/plain'))
    expect('text' in result).toBe(true)
    if (!('text' in result)) return
    expect(result.text).toContain('MAYA')
    expect(result.text).toContain('Welcome to the midnight show')
    expect(result.format).toBe('.fountain')
  })

  it('imports fdx fixture', async () => {
    const result = await importScriptFile(
      fileFromFixture('sample.fdx', 'application/xml'),
    )
    expect('text' in result).toBe(true)
    if (!('text' in result)) return
    expect(result.text).toContain('ANNA')
    expect(result.text).toContain('We made it.')
    expect(result.format).toBe('.fdx')
  })
})
