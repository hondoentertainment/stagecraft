import { useMemo } from 'react'
import type { FormatSettings, TypeOverrides } from '../types/script'
import { dialogueMaxWidth, stageDirectionMaxWidth } from '../lib/dramatistsGuild'
import { formatScriptToHtml } from '../lib/formatter'

interface FormatPreviewProps {
  rawScript: string
  settings: FormatSettings
  typeOverrides?: TypeOverrides
}

export function FormatPreview({
  rawScript,
  settings,
  typeOverrides = {},
}: FormatPreviewProps) {
  const html = useMemo(
    () => formatScriptToHtml(rawScript, settings, typeOverrides),
    [rawScript, settings, typeOverrides],
  )

  const directionWidth = stageDirectionMaxWidth(settings)
  const dialogueWidth = dialogueMaxWidth(settings)
  const directionItalic =
    settings.stageDirectionStyle === 'italic' ? 'italic' : 'normal'

  return (
    <div
      className="script-page mx-auto max-w-[8.5in] rounded-lg bg-[#faf8f5] text-black shadow-2xl shadow-black/40"
      style={{
        fontFamily: 'var(--font-script)',
        fontSize: `${settings.fontSize}pt`,
        lineHeight: 1.6,
      }}
    >
      <style>{`
        .script-page .title-page {
          position: relative;
          min-height: 9in;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          page-break-after: always;
          padding: ${settings.marginTop}in ${settings.marginRight}in ${settings.marginBottom}in ${settings.marginLeft}in;
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
          margin-top: 2em;
        }
        .script-page .title-page .copyright {
          position: absolute;
          bottom: ${settings.marginBottom}in;
          left: ${settings.marginLeft}in;
          text-align: left;
          font-size: 0.85em;
        }
        .script-page .title-page .contact {
          position: absolute;
          bottom: ${settings.marginBottom}in;
          right: ${settings.marginRight}in;
          text-align: right;
          font-size: 0.85em;
          white-space: pre-line;
        }
        .script-page .cast-page {
          min-height: 9in;
          page-break-after: always;
          padding: ${settings.marginTop}in ${settings.marginRight}in ${settings.marginBottom}in ${settings.marginLeft}in;
        }
        .script-page .cast-page h2 {
          text-align: center;
          font-weight: 700;
          text-decoration: underline;
          letter-spacing: 0.08em;
          margin: 0 0 2em;
        }
        .script-page .cast-page ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .script-page .cast-page li {
          margin: 0.4em 0;
        }
        .script-page .script-page-body {
          position: relative;
          min-height: 9in;
          padding: ${settings.marginTop}in ${settings.marginRight}in ${settings.marginBottom}in ${settings.marginLeft}in;
          page-break-after: always;
        }
        .script-page .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5em;
          font-size: 0.75em;
          color: #666;
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
          font-style: ${directionItalic};
          margin: 0.5em 0;
          padding-left: ${Math.max(0, settings.stageDirectionIndent - settings.marginLeft)}in;
          max-width: ${directionWidth};
        }
        .script-page .character {
          margin: 1.2em 0 0;
          padding-left: ${Math.max(0, settings.characterIndent - settings.marginLeft)}in;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .script-page .character.dual {
          margin-top: 0.3em;
        }
        .script-page .parenthetical {
          margin: 0.15em 0;
          padding-left: ${Math.max(0, settings.parentheticalIndent - settings.marginLeft)}in;
          font-style: italic;
        }
        .script-page .dialogue {
          margin: 0;
          padding-left: ${Math.max(0, settings.dialogueIndent - settings.marginLeft)}in;
          max-width: ${dialogueWidth};
        }
        .script-page .dialogue.dual {
          padding-left: ${Math.max(0, settings.dialogueIndent - settings.marginLeft + 0.25)}in;
        }
        .script-page .lyrics {
          margin: 0;
          padding-left: ${Math.max(0, settings.dialogueIndent - settings.marginLeft + 0.25)}in;
          font-weight: 700;
          letter-spacing: 0.04em;
          max-width: ${dialogueWidth};
        }
        .script-page .song-heading {
          text-align: center;
          font-weight: 700;
          margin: 1.5em 0;
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
