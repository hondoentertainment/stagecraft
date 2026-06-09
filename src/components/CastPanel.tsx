import { useMemo } from 'react'
import type { CastMember, CastMetadata } from '../types/script'
import { collectCharacterNames, formatScript } from '../lib/formatter'
import { mergeCastWithDetected, normalizeCastKey } from '../lib/castPage'

interface CastPanelProps {
  rawScript: string
  castMetadata: CastMetadata
  onChange: (metadata: CastMetadata) => void
}

export function CastPanel({ rawScript, castMetadata, onChange }: CastPanelProps) {
  const members = useMemo(() => {
    const formatted = formatScript(rawScript)
    const names = collectCharacterNames(formatted.elements)
    return mergeCastWithDetected(names, castMetadata)
  }, [rawScript, castMetadata])

  const updateMember = (name: string, patch: Partial<CastMember>) => {
    const key = normalizeCastKey(name)
    onChange({
      ...castMetadata,
      [key]: { ...castMetadata[key], name: key, ...patch },
    })
  }

  if (members.length === 0) {
    return (
      <p className="text-xs text-zinc-600">
        No speaking characters detected yet. Add character cues in ALL CAPS.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Dramatists Guild cast page — add age, gender, and brief descriptions.
      </p>
      {members.map((member) => (
        <div
          key={member.name}
          className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
        >
          <p className="text-sm font-semibold text-amber-400">{member.name}</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Age"
              value={member.age}
              onChange={(e) => updateMember(member.name, { age: e.target.value })}
              className="input-field text-xs"
            />
            <input
              type="text"
              placeholder="Gender"
              value={member.gender}
              onChange={(e) => updateMember(member.name, { gender: e.target.value })}
              className="input-field text-xs"
            />
          </div>
          <input
            type="text"
            placeholder="Brief description"
            value={member.description}
            onChange={(e) =>
              updateMember(member.name, { description: e.target.value })
            }
            className="input-field text-xs"
          />
        </div>
      ))}
    </div>
  )
}
