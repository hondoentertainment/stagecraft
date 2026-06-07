import { useMemo } from 'react'
import type { FormatSettings } from '../types/script'
import { formatScript } from '../lib/formatter'
import {
  formatCharacterListReport,
  formatSceneBreakdownReport,
  generateScriptReport,
} from '../lib/reports'
import { copyToClipboard } from '../lib/export'

interface ReportsPanelProps {
  rawScript: string
  settings: FormatSettings
}

export function ReportsPanel({ rawScript, settings }: ReportsPanelProps) {
  const report = useMemo(() => {
    const formatted = formatScript(rawScript, settings)
    return generateScriptReport(formatted.elements, settings)
  }, [rawScript, settings])

  const castText = useMemo(
    () => formatCharacterListReport(report),
    [report],
  )

  const sceneText = useMemo(
    () => formatSceneBreakdownReport(report),
    [report],
  )

  return (
    <div className="space-y-6 text-xs leading-relaxed text-zinc-400">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Pages" value={String(report.pageCount)} />
        <Stat label="Runtime" value={`~${report.runtimeMinutes}m`} />
        <Stat label="Roles" value={String(report.characters.length)} />
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Cast of Characters
          </h3>
          <CopyButton text={castText} />
        </div>
        <ul className="space-y-1.5">
          {report.characters.map((char) => (
            <li
              key={char.name}
              className="flex items-center justify-between rounded-md bg-zinc-900/60 px-3 py-2"
            >
              <span className="font-medium text-zinc-300">{char.name}</span>
              <span className="text-zinc-500">
                {char.lineCount} lines · {char.wordCount} words
              </span>
            </li>
          ))}
          {report.characters.length === 0 && (
            <li className="text-zinc-600">No speaking characters detected.</li>
          )}
        </ul>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Scene Breakdown
          </h3>
          <CopyButton text={sceneText} />
        </div>
        <ul className="space-y-2">
          {report.scenes.map((scene, i) => (
            <li
              key={`${scene.lineNumber}-${i}`}
              className="rounded-md bg-zinc-900/60 px-3 py-2"
            >
              <p className="font-medium text-zinc-300">
                {[scene.act && `Act ${scene.act}`, scene.scene && `Scene ${scene.scene}`]
                  .filter(Boolean)
                  .join(' — ') || `Section at line ${scene.lineNumber}`}
              </p>
              {scene.setting && (
                <p className="mt-0.5 text-zinc-500">{scene.setting}</p>
              )}
              {scene.characters.length > 0 && (
                <p className="mt-1 text-zinc-600">
                  {scene.characters.join(', ')}
                </p>
              )}
            </li>
          ))}
          {report.scenes.length === 0 && (
            <li className="text-zinc-600">No scenes detected.</li>
          )}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-900/60 px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="text-sm font-semibold text-zinc-200">{value}</p>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => void copyToClipboard(text)}
      className="text-[10px] text-amber-500/80 transition hover:text-amber-400"
    >
      Copy
    </button>
  )
}
