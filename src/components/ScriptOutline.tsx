import { useMemo } from 'react'
import type { FormatSettings, ScriptElementType, TypeOverrides } from '../types/script'
import { formatScript } from '../lib/formatter'
import { ALL_ELEMENT_TYPES, getElementLabel } from '../lib/parser'

interface ScriptOutlineProps {
  rawScript: string
  settings: FormatSettings
  typeOverrides: TypeOverrides
  onTypeOverride: (lineNumber: number, type: ScriptElementType) => void
  onLineClick: (lineNumber: number) => void
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
  lyrics: 'bg-purple-500/20 text-purple-300',
  song_heading: 'bg-indigo-500/20 text-indigo-300',
}

export function ScriptOutline({
  rawScript,
  settings,
  typeOverrides,
  onTypeOverride,
  onLineClick,
}: ScriptOutlineProps) {
  const formatted = useMemo(
    () => formatScript(rawScript, settings, typeOverrides),
    [rawScript, settings, typeOverrides],
  )

  const visible = formatted.elements.filter((e) => e.type !== 'blank')

  return (
    <div className="flex h-full flex-col">
      {formatted.warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {formatted.warnings.map((warning) => (
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
        <span className="text-xs text-zinc-600">
          {visible.length} elements · {formatted.pageCount} pg · ~{formatted.estimatedRuntimeMinutes}m
        </span>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto pr-1">
        {visible.map((el, i) => {
          const isOverridden = typeOverrides[el.lineNumber] !== undefined
          return (
            <li
              key={`${el.lineNumber}-${i}`}
              className="group flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-zinc-800/50"
            >
              <select
                value={el.type}
                onChange={(e) =>
                  onTypeOverride(el.lineNumber, e.target.value as ScriptElementType)
                }
                className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-medium outline-none ${TYPE_COLORS[el.type] ?? 'bg-zinc-700 text-zinc-300'} ${isOverridden ? 'ring-1 ring-amber-500/50' : ''}`}
                title="Override element type"
              >
                {ALL_ELEMENT_TYPES.filter((t) => t !== 'blank').map((t) => (
                  <option key={t} value={t} className="bg-zinc-900 text-zinc-200">
                    {getElementLabel(t)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onLineClick(el.lineNumber)}
                className="min-w-0 flex-1 truncate text-left text-zinc-400 transition hover:text-zinc-200"
                title={`Jump to line ${el.lineNumber}`}
              >
                {el.text || '(empty)'}
              </button>
              <button
                type="button"
                onClick={() => onLineClick(el.lineNumber)}
                className="shrink-0 text-zinc-600 transition hover:text-amber-400"
              >
                L{el.lineNumber}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
