/**
 * Converts Fountain screenplay/play markup to plain text our stage parser understands.
 */
export function fountainToRaw(fountain: string): string {
  const lines = fountain.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []
  let inLyrics = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      output.push('')
      inLyrics = false
      continue
    }

    // Title page blocks
    if (trimmed.startsWith('Title:')) {
      output.push(trimmed.replace(/^Title:\s*/i, ''))
      continue
    }
    if (trimmed.startsWith('Author:')) {
      output.push(`By ${trimmed.replace(/^Author:\s*/i, '')}`)
      continue
    }
    if (trimmed.startsWith('Credit:') || trimmed.startsWith('Source:')) {
      output.push(trimmed.replace(/^(Credit|Source):\s*/i, ''))
      continue
    }

    // Section headings (acts/scenes)
    if (trimmed.startsWith('#')) {
      const heading = trimmed.replace(/^#+\s*/, '').toUpperCase()
      if (/^ACT\b/i.test(heading) || /^SCENE\b/i.test(heading)) {
        output.push(heading)
      } else {
        output.push(heading)
      }
      continue
    }

    // Lyrics
    if (trimmed.startsWith('~')) {
      if (!inLyrics) {
        output.push('SONG')
        inLyrics = true
      }
      output.push(trimmed.slice(1).trim())
      continue
    }
    inLyrics = false

    // Transitions (leading >)
    if (trimmed.startsWith('>')) {
      output.push(trimmed.replace(/^>\s*/, '').toUpperCase())
      continue
    }

    // Forced transitions (leading .)
    if (trimmed.startsWith('.') && !trimmed.startsWith('..')) {
      output.push(trimmed.slice(1).trim().toUpperCase())
      continue
    }

    // Scene headings (leading .)
    if (/^\.(INT|EXT|EST)/i.test(trimmed)) {
      output.push(trimmed.slice(1).trim())
      continue
    }

    // Character cues (all caps line, optional ^ for dual dialogue)
    const charMatch = trimmed.match(/^([A-Z][A-Z0-9\s.'\-()]+?)(\^)?(\s*\(.*\))?\s*$/)
    const nextLine = lines[i + 1]?.trim() ?? ''
    const isCharacter =
      charMatch &&
      /^[A-Z]/.test(trimmed) &&
      !trimmed.endsWith('.') &&
      (nextLine.startsWith('(') || (nextLine && nextLine[0] === nextLine[0].toLowerCase()) || !nextLine)

    if (isCharacter && charMatch) {
      let name = charMatch[1].trim()
      if (charMatch[3]) name += ` ${charMatch[3].trim()}`
      output.push(name)

      // Dual dialogue: next character line with ^
      if (charMatch[2] && i + 2 < lines.length) {
        const dualChar = lines[i + 1]?.trim()
        const dualDialogue = lines[i + 2]?.trim()
        if (dualChar && dualDialogue) {
          output.push(`[DUAL: ${dualChar.replace(/\^$/, '')}]`)
          output.push(dualDialogue)
          i += 2
        }
      }
      continue
    }

    // Parentheticals
    if (/^\([^)]+\)$/.test(trimmed)) {
      output.push(trimmed)
      continue
    }

    output.push(trimmed)
  }

  return output.join('\n')
}

export function isFountainContent(text: string): boolean {
  return (
    /^Title:/im.test(text) ||
    /^Author:/im.test(text) ||
    /^\.(INT|EXT)/im.test(text) ||
    /^FADE (IN|OUT)/im.test(text) ||
    /^#/m.test(text) ||
    /^~/m.test(text)
  )
}
