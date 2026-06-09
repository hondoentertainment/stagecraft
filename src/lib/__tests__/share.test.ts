import { describe, expect, it } from 'vitest'
import { decodeShareLink, encodeShareLink } from '../share'

describe('share', () => {
  it('round-trips script payload', async () => {
    const payload = {
      v: 1 as const,
      script: 'MARCUS\nHello.',
      settings: { formatPreset: 'dramatists-guild' as const },
    }
    const hash = await encodeShareLink(payload)
    const decoded = await decodeShareLink(hash)
    expect(decoded?.script).toBe(payload.script)
    expect(decoded?.settings?.formatPreset).toBe('dramatists-guild')
  })
})
