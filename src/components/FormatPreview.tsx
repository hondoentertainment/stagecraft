import { useMemo } from 'react'
import type { FormatSettings } from '../types/script'
import { formatScriptToHtml } from '../lib/formatter'

interface FormatPreviewProps {
  rawScript: string
  settings: FormatSettings
}

export function FormatPreview({ rawScript, settings }: FormatPreviewProps) {
  const html = useMemo(
    () => formatScriptToHtml(rawScript, settings),
    [rawScript, settings],
  )

  return (
    <div
      className="script-page mx-auto max-w-[8.5in] rounded-lg bg-[#faf8f5] px-[1in] py-[1in] text-black shadow-2xl shadow-black/40"
      style={{
        fontFamily: 'var(--font-script)',
        fontSize: `${settings.fontSize}pt`,
        lineHeight: 1.6,
      }}
    >
      <style>{`
        .script-page .title-page {
          min-height: 9in;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          page-break-after: always;
        }
        .script-page .title-page h1 {
          font-size: 1.4em;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin: 0;
        }
        .script-page .title-page .subtitle {
          margin-top: 1em;
          font-style: italic;
        }
        .script-page .title-page .author {
          margin-top: 3em;
        }
        .script-page .title-page .contact {
          margin-top: auto;
          font-size: 0.85em;
        }
        .script-page .act,
        .script-page .scene {
          text-align: center;
          font-weight: 700;
          letter-spacing: 0.12em;
          margin: 2em 0 0.5em;
        }
        .script-page .setting,
        .script-page .direction {
          font-style: ${settings.stageDirectionStyle === 'plain' ? 'normal' : 'italic'};
          margin: 0.5em 0;
        }
        .script-page .character {
          margin: 1.2em 0 0;
          padding-left: ${settings.characterIndent * 0.45}em;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .script-page .parenthetical {
          margin: 0.15em 0;
          padding-left: ${settings.parentheticalIndent * 0.55}em;
          font-style: italic;
        }
        .script-page .dialogue {
          margin: 0;
          padding-left: ${settings.dialogueIndent * 0.55}em;
          max-width: 4in;
        }
        .script-page .transition {
          text-align: right;
          margin: 1.5em 0;
          font-weight: 700;
        }
        .script-page .spacer {
          height: 0.75em;
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
