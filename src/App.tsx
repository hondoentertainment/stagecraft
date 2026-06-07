import { useCallback, useMemo, useState } from 'react'
import { FormatPreview } from './components/FormatPreview'
import { ScriptOutline } from './components/ScriptOutline'
import { SettingsPanel } from './components/SettingsPanel'
import { copyToClipboard, downloadText, printScript, sanitizeFilename } from './lib/export'
import { formatScript } from './lib/formatter'
import { DEFAULT_SETTINGS, SAMPLE_SCRIPT } from './types/script'
import type { FormatSettings } from './types/script'

type View = 'split' | 'editor' | 'preview'

export default function App() {
  const [rawScript, setRawScript] = useState(SAMPLE_SCRIPT)
  const [settings, setSettings] = useState<FormatSettings>(DEFAULT_SETTINGS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [view, setView] = useState<View>('split')
  const [copied, setCopied] = useState(false)
  const [exportingDocx, setExportingDocx] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<'outline' | 'tips'>('outline')

  const formatted = useMemo(
    () => formatScript(rawScript, settings),
    [rawScript, settings],
  )

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(formatted.plainText)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [formatted.plainText])

  const handleDownload = useCallback(() => {
    const name = sanitizeFilename(settings.titlePage.title)
    downloadText(formatted.plainText, `${name}.txt`)
  }, [formatted.plainText, settings.titlePage.title])

  const handleDownloadDocx = useCallback(async () => {
    setExportingDocx(true)
    try {
      const { downloadScriptDocx } = await import('./lib/docxExport')
      await downloadScriptDocx(rawScript, settings)
    } finally {
      setExportingDocx(false)
    }
  }, [rawScript, settings])

  const handlePrint = useCallback(() => {
    printScript(settings)
  }, [settings])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-black">
              S
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                Stagecraft
              </h1>
              <p className="hidden text-xs text-zinc-500 sm:block">
                Professional playwright formatter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ViewToggle view={view} onChange={setView} />

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="btn-secondary hidden sm:inline-flex"
            >
              Settings
            </button>
            <button type="button" onClick={handleCopy} className="btn-secondary">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button type="button" onClick={handleDownload} className="btn-secondary hidden sm:inline-flex">
              .txt
            </button>
            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={exportingDocx}
              className="btn-secondary hidden sm:inline-flex disabled:opacity-50"
            >
              {exportingDocx ? 'Exporting…' : '.docx'}
            </button>
            <button type="button" onClick={handlePrint} className="btn-primary">
              Print / PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-0 lg:flex-row">
        {(view === 'split' || view === 'editor') && (
          <section className="no-print flex min-h-[40vh] flex-1 flex-col border-b border-zinc-800 lg:min-h-0 lg:max-w-[50%] lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Raw Script
              </h2>
              <button
                type="button"
                onClick={() => setRawScript(SAMPLE_SCRIPT)}
                className="text-xs text-amber-500/80 transition hover:text-amber-400"
              >
                Load sample
              </button>
            </div>
            <textarea
              value={rawScript}
              onChange={(e) => setRawScript(e.target.value)}
              spellCheck={false}
              placeholder="Paste or type your script here..."
              className="min-h-[300px] flex-1 resize-none bg-transparent px-4 py-4 font-[family-name:var(--font-script)] text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600 lg:min-h-0"
            />
          </section>
        )}

        {(view === 'split' || view === 'preview') && (
          <section className="flex min-h-[50vh] flex-1 flex-col lg:min-h-0">
            <div className="no-print flex items-center justify-between border-b border-zinc-800/60 px-4 py-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Formatted Preview
              </h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="text-xs text-zinc-500 transition hover:text-zinc-300 sm:hidden"
              >
                Settings
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto bg-zinc-900/50 p-4 sm:p-8">
                <FormatPreview rawScript={rawScript} settings={settings} />
              </div>

              {view === 'split' && (
                <aside className="no-print hidden w-72 shrink-0 flex-col border-l border-zinc-800 bg-zinc-950/50 p-4 xl:flex">
                  <div className="mb-3 flex gap-1 rounded-lg bg-zinc-900 p-1">
                    <TabButton
                      active={sidebarTab === 'outline'}
                      onClick={() => setSidebarTab('outline')}
                    >
                      Outline
                    </TabButton>
                    <TabButton
                      active={sidebarTab === 'tips'}
                      onClick={() => setSidebarTab('tips')}
                    >
                      Guide
                    </TabButton>
                  </div>

                  {sidebarTab === 'outline' ? (
                    <ScriptOutline rawScript={rawScript} settings={settings} />
                  ) : (
                    <FormattingGuide />
                  )}
                </aside>
              )}
            </div>
          </section>
        )}
      </main>

      <SettingsPanel
        settings={settings}
        onChange={setSettings}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <div className="hidden print-only">
        <FormatPreview rawScript={rawScript} settings={settings} />
      </div>
    </div>
  )
}

function ViewToggle({
  view,
  onChange,
}: {
  view: View
  onChange: (v: View) => void
}) {
  const options: { id: View; label: string }[] = [
    { id: 'split', label: 'Split' },
    { id: 'editor', label: 'Edit' },
    { id: 'preview', label: 'Preview' },
  ]

  return (
    <div className="flex rounded-lg bg-zinc-900 p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition sm:px-3 ${
            view === opt.id
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  )
}

function FormattingGuide() {
  return (
    <div className="space-y-4 text-xs leading-relaxed text-zinc-400">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Formatting Guide
      </h3>
      <div className="space-y-3">
        <GuideItem title="Character names" example="MARCUS">
          Use ALL CAPS on their own line before dialogue.
        </GuideItem>
        <GuideItem title="Parentheticals" example="(quietly)">
          Wrap actor direction in parentheses on its own line.
        </GuideItem>
        <GuideItem title="Act & Scene" example="ACT 1 / SCENE 2">
          Mark structural breaks — combined or separate lines work.
        </GuideItem>
        <GuideItem title="Stage directions" example="Marcus exits.">
          Action lines are auto-detected and italicized.
        </GuideItem>
        <GuideItem title="Transitions" example="FADE OUT.">
          Standard transitions are centered-right automatically.
        </GuideItem>
      </div>
    </div>
  )
}

function GuideItem({
  title,
  example,
  children,
}: {
  title: string
  example: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="font-medium text-zinc-300">{title}</p>
      <code className="mt-0.5 block font-[family-name:var(--font-script)] text-amber-500/90">
        {example}
      </code>
      <p className="mt-1">{children}</p>
    </div>
  )
}
