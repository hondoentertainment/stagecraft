import { useMemo } from 'react'
import type { FormatSettings } from '../types/script'
import { formatScript } from '../lib/formatter'
import { getElementLabel } from '../lib/parser'

interface ScriptOutlineProps {
  rawScript: string
  settings: FormatSettings
}

const TYPE_COLORS: Record<string, string> = {
  act: 'bg-violet-500/20 text-violet-300',
  scene: 'bg-blue-500/20 text-blue-300',
  character: 'bg-amber-500/20 text-amber-300',
  dialogue: 'bg-emerald-500/20 text-emerald-300',
  stage_direction: 'bg-zinc-500/20 text-zinc-300',
  parenthetical: 'bg-pink-500/20 text-pink-300',
  transition: 'bg-orange-500/20 text-orange-300',
  setting: 'bg-cyan-500/20 text-cyan-300',
}

export function ScriptOutline({ rawScript, settings }: ScriptOutlineProps) {
  const { elements, warnings } = useMemo(
    () => formatScript(rawScript, settings),
    [rawScript, settings],
  )

  const visible = elements.filter((e) => e.type !== 'blank')

  return (
    <div className="flex h-full flex-col">
      {warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {warnings.map((warning) => (
            <p
              key={warning}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
            >
              {warning}
            </p>
          ))}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Parsed Structure
        </h3>
        <span className="text-xs text-zinc-600">{visible.length} elements</span>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto pr-1">
        {visible.map((el, i) => (
          <li
            key={`${el.lineNumber}-${i}`}
            className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-zinc-800/50"
          >
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${TYPE_COLORS[el.type] ?? 'bg-zinc-700 text-zinc-300'}`}
            >
              {getElementLabel(el.type)}
            </span>
            <span className="truncate text-zinc-400">
              {el.text || '(empty)'}
            </span>
            <span className="ml-auto shrink-0 text-zinc-600">L{el.lineNumber}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
