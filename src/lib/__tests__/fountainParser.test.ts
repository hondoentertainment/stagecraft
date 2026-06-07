import { describe, expect, it } from 'vitest'
import { fountainToRaw, isFountainContent } from '../fountainParser'

describe('fountainParser', () => {
  it('detects fountain content', () => {
    expect(isFountainContent('Title: My Play\nAuthor: Jane')).toBe(true)
    expect(isFountainContent('Just plain text.')).toBe(false)
  })

  it('converts title and author', () => {
    const raw = fountainToRaw('Title: My Play\nAuthor: Jane Doe\n\nMARCUS\nHello.')
    expect(raw).toContain('My Play')
    expect(raw).toContain('By Jane Doe')
    expect(raw).toContain('MARCUS')
  })

  it('converts lyrics lines', () => {
    const raw = fountainToRaw('~First line\n~Second line')
    expect(raw).toContain('SONG')
    expect(raw).toContain('First line')
    expect(raw).toContain('Second line')
  })

  it('converts transitions', () => {
    const raw = fountainToRaw('> FADE OUT.')
    expect(raw).toContain('FADE OUT.')
  })
})
