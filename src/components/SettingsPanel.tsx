import type { FormatPresetId, FormatSettings } from '../types/script'
import { FORMAT_PRESETS, applyPreset } from '../lib/presets'

interface SettingsPanelProps {
  settings: FormatSettings
  onChange: (settings: FormatSettings) => void
  open: boolean
  onClose: () => void
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  )
}

export function SettingsPanel({
  settings,
  onChange,
  open,
  onClose,
}: SettingsPanelProps) {
  if (!open) return null

  const update = <K extends keyof FormatSettings>(key: K, value: FormatSettings[K]) => {
    onChange({ ...settings, [key]: value, formatPreset: 'custom' })
  }

  const updateTitle = (key: keyof FormatSettings['titlePage'], value: string) => {
    onChange({
      ...settings,
      titlePage: { ...settings.titlePage, [key]: value },
      formatPreset: 'custom',
    })
  }

  const handlePreset = (presetId: FormatPresetId) => {
    onChange(applyPreset(presetId, settings))
  }

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close settings"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Format Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="mb-4 text-sm font-semibold text-amber-400">Format Preset</h3>
            <div className="grid gap-2">
              {FORMAT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePreset(preset.id)}
                  className={`rounded-lg border px-3 py-2.5 text-left transition ${
                    settings.formatPreset === preset.id
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-200">{preset.label}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{preset.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-semibold text-amber-400">Title Page</h3>
            <div className="space-y-4">
              <Field label="Title">
                <input
                  type="text"
                  value={settings.titlePage.title}
                  onChange={(e) => updateTitle('title', e.target.value)}
                  className="input-field"
                />
              </Field>
              <Field label="Subtitle">
                <input
                  type="text"
                  value={settings.titlePage.subtitle}
                  onChange={(e) => updateTitle('subtitle', e.target.value)}
                  className="input-field"
                />
              </Field>
              <Field label="Author">
                <input
                  type="text"
                  value={settings.titlePage.author}
                  onChange={(e) => updateTitle('author', e.target.value)}
                  className="input-field"
                />
              </Field>
              <Field label="Contact Info">
                <textarea
                  value={settings.titlePage.contact}
                  onChange={(e) => updateTitle('contact', e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Agent, email, or rights info"
                />
              </Field>
              <Field label="Synopsis (for submission package)">
                <textarea
                  value={settings.synopsis}
                  onChange={(e) => update('synopsis', e.target.value)}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Brief plot summary for agents and theatres"
                />
              </Field>
              <label className="flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={settings.showTitlePage}
                  onChange={(e) => update('showTitlePage', e.target.checked)}
                  className="size-4 rounded border-zinc-600 bg-zinc-900 accent-amber-500"
                />
                Include title page
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-semibold text-amber-400">Layout</h3>
            <div className="space-y-4">
              <Field label="Font Size (pt)">
                <input
                  type="number"
                  min={10}
                  max={14}
                  value={settings.fontSize}
                  onChange={(e) => update('fontSize', Number(e.target.value))}
                  className="input-field"
                />
              </Field>
              <Field label="Character Indent (in)">
                <input
                  type="number"
                  min={2}
                  max={5}
                  step={0.5}
                  value={settings.characterIndent}
                  onChange={(e) => update('characterIndent', Number(e.target.value))}
                  className="input-field"
                />
              </Field>
              <Field label="Dialogue Indent (in)">
                <input
                  type="number"
                  min={1}
                  max={4}
                  step={0.5}
                  value={settings.dialogueIndent}
                  onChange={(e) => update('dialogueIndent', Number(e.target.value))}
                  className="input-field"
                />
              </Field>
              <Field label="Parenthetical Indent (in)">
                <input
                  type="number"
                  min={1}
                  max={4}
                  step={0.5}
                  value={settings.parentheticalIndent}
                  onChange={(e) => update('parentheticalIndent', Number(e.target.value))}
                  className="input-field"
                />
              </Field>
              <Field label="Lines Per Page">
                <input
                  type="number"
                  min={40}
                  max={60}
                  value={settings.linesPerPage}
                  onChange={(e) => update('linesPerPage', Number(e.target.value))}
                  className="input-field"
                />
              </Field>
              <Field label="Act / Scene Number Style">
                <select
                  value={settings.actSceneStyle}
                  onChange={(e) =>
                    update('actSceneStyle', e.target.value as FormatSettings['actSceneStyle'])
                  }
                  className="input-field"
                >
                  <option value="roman">Roman (I, II, III)</option>
                  <option value="arabic">Arabic (1, 2, 3)</option>
                  <option value="words">Words (ONE, TWO)</option>
                </select>
              </Field>
              <Field label="Stage Direction Style">
                <select
                  value={settings.stageDirectionStyle}
                  onChange={(e) =>
                    update(
                      'stageDirectionStyle',
                      e.target.value as FormatSettings['stageDirectionStyle'],
                    )
                  }
                  className="input-field"
                >
                  <option value="italic">Italic text</option>
                  <option value="parentheses">Wrapped in (parentheses)</option>
                  <option value="plain">Plain text</option>
                </select>
              </Field>
              <label className="flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={settings.includePageNumbers}
                  onChange={(e) => update('includePageNumbers', e.target.checked)}
                  className="size-4 rounded border-zinc-600 bg-zinc-900 accent-amber-500"
                />
                Include page numbers
              </label>
              <label className="flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={settings.doubleSpaceAfterCharacter}
                  onChange={(e) => update('doubleSpaceAfterCharacter', e.target.checked)}
                  className="size-4 rounded border-zinc-600 bg-zinc-900 accent-amber-500"
                />
                Double-space after character names
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-semibold text-amber-400">Page Margins (in)</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Left">
                <input
                  type="number"
                  min={1}
                  max={2.5}
                  step={0.25}
                  value={settings.marginLeft}
                  onChange={(e) => update('marginLeft', Number(e.target.value))}
                  className="input-field"
                />
              </Field>
              <Field label="Right">
                <input
                  type="number"
                  min={0.5}
                  max={2}
                  step={0.25}
                  value={settings.marginRight}
                  onChange={(e) => update('marginRight', Number(e.target.value))}
                  className="input-field"
                />
              </Field>
              <Field label="Top">
                <input
                  type="number"
                  min={0.5}
                  max={2}
                  step={0.25}
                  value={settings.marginTop}
                  onChange={(e) => update('marginTop', Number(e.target.value))}
                  className="input-field"
                />
              </Field>
              <Field label="Bottom">
                <input
                  type="number"
                  min={0.5}
                  max={2}
                  step={0.25}
                  value={settings.marginBottom}
                  onChange={(e) => update('marginBottom', Number(e.target.value))}
                  className="input-field"
                />
              </Field>
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
