const MAX_FILE_SIZE = 100 * 1024 * 1024

const SUPPORTED_EXTENSIONS = ['.txt', '.text', '.docx', '.fountain', '.fdx', '.md'] as const

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number]

export interface ImportResult {
  text: string
  filename: string
  format: SupportedExtension | 'unknown'
}

export interface ImportError {
  message: string
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  if (dot === -1) return ''
  return filename.slice(dot).toLowerCase()
}

function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '')
  return base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function isSupportedScriptFile(file: File): boolean {
  const ext = getExtension(file.name)
  return SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension)
}

export function getAcceptedFileTypes(): string {
  return SUPPORTED_EXTENSIONS.join(',')
}

async function readTextFile(file: File, ext: string): Promise<string> {
  const text = await file.text()
  if (ext === '.fountain' || ext === '.md') {
    const { fountainToRaw, isFountainContent } = await import('./fountainParser')
    if (ext === '.fountain' || isFountainContent(text)) {
      return fountainToRaw(text)
    }
  }
  return text
}

async function readDocxFile(file: File): Promise<string> {
  const { default: mammoth } = await import('mammoth')
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value.replace(/\r\n/g, '\n').trim()
}

async function readFdxFile(file: File): Promise<string> {
  const xml = await file.text()
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid FDX file')
  }

  const lines: string[] = []

  for (const paragraph of doc.querySelectorAll('Paragraph')) {
    const type = paragraph.getAttribute('Type') ?? ''
    const content = paragraph.textContent?.trim() ?? ''
    if (!content) continue

    switch (type) {
      case 'Character':
        lines.push(content.toUpperCase())
        break
      case 'Parenthetical':
        lines.push(content.startsWith('(') ? content : `(${content})`)
        break
      case 'Scene Heading':
        lines.push(content.toUpperCase())
        lines.push('')
        break
      case 'Transition':
        lines.push('')
        lines.push(content.toUpperCase())
        lines.push('')
        break
      default:
        lines.push(content)
        break
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export async function importScriptFile(
  file: File,
): Promise<ImportResult | ImportError> {
  if (file.size > MAX_FILE_SIZE) {
    return { message: 'File is too large. Maximum size is 100 MB.' }
  }

  const ext = getExtension(file.name)

  if (!SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension)) {
    return {
      message: `Unsupported file type. Use ${SUPPORTED_EXTENSIONS.join(', ')}.`,
    }
  }

  try {
    let text: string

    if (ext === '.docx') {
      text = await readDocxFile(file)
    } else if (ext === '.fdx') {
      text = await readFdxFile(file)
    } else {
      text = await readTextFile(file, ext)
    }

    if (!text.trim()) {
      return { message: 'The uploaded file appears to be empty.' }
    }

    return {
      text,
      filename: file.name,
      format: ext as SupportedExtension,
    }
  } catch {
    return {
      message: 'Could not read the file. It may be corrupted or password-protected.',
    }
  }
}

export function deriveTitleFromImport(filename: string): string {
  const derived = titleFromFilename(filename)
  return derived || 'Untitled Play'
}

export { SUPPORTED_EXTENSIONS, titleFromFilename }
