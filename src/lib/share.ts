import type { CastMetadata, FormatSettings, TypeOverrides } from '../types/script'

export interface SharePayload {
  v: 1
  script: string
  settings?: Partial<FormatSettings>
  typeOverrides?: TypeOverrides
  castMetadata?: CastMetadata
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? padded : padded + '='.repeat(4 - (padded.length % 4))
  const binary = atob(pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function encodeShareLink(payload: SharePayload): Promise<string> {
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  if ('CompressionStream' in globalThis) {
    const stream = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)]).stream().pipeThrough(new CompressionStream('gzip'))
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer())
    return `#s=${toBase64Url(compressed)}`
  }
  return `#s=${toBase64Url(bytes)}`
}

export async function decodeShareLink(hash: string): Promise<SharePayload | null> {
  const match = hash.match(/^#s=(.+)$/)
  if (!match) return null
  try {
    let bytes = fromBase64Url(match[1])
    if ('DecompressionStream' in globalThis) {
      try {
        const stream = new Blob([bytes.slice()]).stream().pipeThrough(new DecompressionStream('gzip'))
        bytes = new Uint8Array(await new Response(stream).arrayBuffer())
      } catch {
        // not compressed
      }
    }
    const json = new TextDecoder().decode(bytes)
    const payload = JSON.parse(json) as SharePayload
    if (payload.v !== 1 || typeof payload.script !== 'string') return null
    return payload
  } catch {
    return null
  }
}

export async function buildShareUrl(
  origin: string,
  payload: SharePayload,
): Promise<string> {
  const hash = await encodeShareLink(payload)
  return `${origin}${origin.endsWith('/') ? '' : '/'}${hash}`
}
