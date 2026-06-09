import type { CastMember, CastMetadata } from '../types/script'

export function normalizeCastKey(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').trim().toUpperCase()
}

export function mergeCastWithDetected(
  characterNames: string[],
  metadata: CastMetadata,
): CastMember[] {
  const merged: CastMember[] = []
  const seen = new Set<string>()

  for (const name of characterNames.sort()) {
    const key = normalizeCastKey(name)
    if (seen.has(key)) continue
    seen.add(key)
    const existing = metadata[key]
    merged.push(
      existing ?? {
        name: key,
        age: '',
        gender: '',
        description: '',
      },
    )
  }

  return merged
}

export function formatCastEntry(member: CastMember): string {
  const parts: string[] = [member.name]
  const meta: string[] = []
  if (member.age) meta.push(member.age)
  if (member.gender) meta.push(member.gender)
  if (meta.length) parts.push(`(${meta.join(', ')})`)
  if (member.description) parts.push(`— ${member.description}`)
  return parts.join(' ')
}

export function formatCastPagePlain(members: CastMember[], marginLeft = 1.5): string[] {
  const pad = ' '.repeat(Math.round(marginLeft * 10))
  const lines = ['', '          CAST OF CHARACTERS', '', '']
  for (const member of members) {
    lines.push(pad + formatCastEntry(member))
  }
  lines.push('', '')
  return lines
}

export function formatCastPageHtml(members: CastMember[]): string {
  const items = members
    .map((m) => {
      const meta = [m.age, m.gender].filter(Boolean).join(', ')
      const metaHtml = meta ? ` <span class="cast-meta">(${meta})</span>` : ''
      const descHtml = m.description
        ? `<span class="cast-desc"> — ${escapeHtml(m.description)}</span>`
        : ''
      return `<li><strong>${escapeHtml(m.name)}</strong>${metaHtml}${descHtml}</li>`
    })
    .join('')
  return `<div class="cast-page"><h2>Cast of Characters</h2><ul>${items}</ul></div>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
