import { useCallback, useMemo, useRef, useState } from 'react'
import { FormatPreview } from './components/FormatPreview'
import { ProjectsPanel } from './components/ProjectsPanel'
import { ReportsPanel } from './components/ReportsPanel'
import { ScriptOutline } from './components/ScriptOutline'
import { ScriptUpload } from './components/ScriptUpload'
import { SettingsPanel } from './components/SettingsPanel'
import { useAutosave } from './hooks/useAutosave'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { copyToClipboard, downloadText, printScript, sanitizeFilename } from './lib/export'
import { formatScript } from './lib/formatter'
import { deriveTitleFromImport } from './lib/importScript'
import { createProject, loadDraft, saveProject } from './lib/storage'
import { DEFAULT_SETTINGS, SAMPLE_SCRIPT } from './types/script'
import type { FormatSettings, ScriptElementType, ScriptProject, TypeOverrides } from './types/script'

type View = 'split' | 'editor' | 'preview'
type SidebarTab = 'outline' | 'reports' | 'tips'

export default function App() {
  const draft = loadDraft()
  const [rawScript, setRawScript] = useState(draft?.rawScript ?? SAMPLE_SCRIPT)
  const [settings, setSettings] = useState<FormatSettings>(
    draft?.settings ?? DEFAULT_SETTINGS,
  )
  const [typeOverrides, setTypeOverrides] = useState<TypeOverrides>(
    draft?.typeOverrides ?? {},
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [view, setView] = useState<View>('split')
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('outline')
  const [savedFlash, setSavedFlash] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useAutosave(rawScript, settings, typeOverrides)

  const formatted = useMemo(
    () => formatScript(rawScript, settings, typeOverrides),
    [rawScript, settings, typeOverrides],
  )

  const handleSaveProject = useCallback(() => {
    const project = createProject(
      settings.titlePage.title || 'Untitled Play',
      rawScript,
      settings,
      typeOverrides,
    )
    saveProject(project)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }, [rawScript, settings, typeOverrides])

  useKeyboardShortcuts({
    onSave: handleSaveProject,
    onPrint: () => printScript(settings),
    onCopy: () => void handleCopy(),
  })

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

  const runExport = useCallback(
    async (key: string, fn: () => Promise<void>) => {
      setExporting(key)
      try {
        await fn()
      } finally {
        setExporting(null)
      }
    },
    [],
  )

  const handleDownloadDocx = useCallback(() => {
    void runExport('docx', async () => {
      const { downloadScriptDocx } = await import('./lib/docxExport')
      await downloadScriptDocx(rawScript, settings)
    })
  }, [rawScript, settings, runExport])

  const handleDownloadPdf = useCallback(() => {
    void runExport('pdf', async () => {
      const { downloadScriptPdf } = await import('./lib/pdfExport')
      await downloadScriptPdf(rawScript, settings)
    })
  }, [rawScript, settings, runExport])

  const handleDownloadFountain = useCallback(() => {
    void runExport('fountain', async () => {
      const { downloadFountain } = await import('./lib/fountainExport')
      downloadFountain(rawScript, settings)
    })
  }, [rawScript, settings, runExport])

  const handleDownloadFdx = useCallback(() => {
    void runExport('fdx', async () => {
      const { downloadFdx } = await import('./lib/fdxExport')
      downloadFdx(rawScript, settings)
    })
  }, [rawScript, settings, runExport])

  const handleDownloadSubmission = useCallback(() => {
    void runExport('zip', async () => {
      const { downloadSubmissionPackage } = await import('./lib/submissionExport')
      await downloadSubmissionPackage(rawScript, settings)
    })
  }, [rawScript, settings, runExport])

  const handlePrint = useCallback(() => {
    printScript(settings)
  }, [settings])

  const handleImport = useCallback((text: string, filename: string) => {
    setRawScript(text)
    setTypeOverrides({})
    setSettings((prev) => ({
      ...prev,
      titlePage: {
        ...prev.titlePage,
        title: deriveTitleFromImport(filename),
      },
    }))
  }, [])

  const handleTypeOverride = useCallback(
    (lineNumber: number, type: ScriptElementType) => {
      setTypeOverrides((prev) => ({ ...prev, [lineNumber]: type }))
    },
    [],
  )

  const handleLineClick = useCallback((lineNumber: number) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const lines = rawScript.split('\n')
    let pos = 0
    for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
      pos += lines[i].length + 1
    }
    textarea.focus()
    textarea.setSelectionRange(pos, pos + (lines[lineNumber - 1]?.length ?? 0))
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
    textarea.scrollTop = Math.max(0, (lineNumber - 3) * lineHeight)
  }, [rawScript])

  const handleLoadProject = useCallback((project: ScriptProject) => {
    setRawScript(project.rawScript)
    setSettings(project.settings)
    setTypeOverrides(project.typeOverrides)
  }, [])

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
                {savedFlash && (
                  <span className="ml-2 text-emerald-400">· Saved</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ViewToggle view={view} onChange={setView} />

            <button
              type="button"
              onClick={() => setProjectsOpen(true)}
              className="btn-secondary hidden sm:inline-flex"
            >
              Projects
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="btn-secondary hidden sm:inline-flex"
            >
              Settings
            </button>
            <ExportMenu
              copied={copied}
              exporting={exporting}
              onCopy={() => void handleCopy()}
              onTxt={handleDownload}
              onDocx={handleDownloadDocx}
              onPdf={handleDownloadPdf}
              onFountain={handleDownloadFountain}
              onFdx={handleDownloadFdx}
              onSubmission={handleDownloadSubmission}
              onPrint={handlePrint}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-0 lg:flex-row">
        {(view === 'split' || view === 'editor') && (
          <section className="no-print flex min-h-[40vh] flex-1 flex-col border-b border-zinc-800 lg:min-h-0 lg:max-w-[50%] lg:border-b-0 lg:border-r">
            <ScriptUpload
              onImport={handleImport}
              onLoadSample={() => {
                setRawScript(SAMPLE_SCRIPT)
                setTypeOverrides({})
              }}
            >
              <textarea
                ref={textareaRef}
                value={rawScript}
                onChange={(e) => setRawScript(e.target.value)}
                spellCheck={false}
                placeholder="Paste, type, or upload a script (.txt, .docx, .fountain, .fdx, .md)…"
                className="min-h-[300px] flex-1 resize-none bg-transparent px-4 py-4 font-[family-name:var(--font-script)] text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600 lg:min-h-0"
              />
            </ScriptUpload>
          </section>
        )}

        {(view === 'split' || view === 'preview') && (
          <section className="flex min-h-[50vh] flex-1 flex-col lg:min-h-0">
            <div className="no-print flex items-center justify-between border-b border-zinc-800/60 px-4 py-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Formatted Preview
                <span className="ml-2 font-normal text-zinc-600">
                  {formatted.pageCount} pages · ~{formatted.estimatedRuntimeMinutes} min
                </span>
              </h2>
              <div className="flex gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => setProjectsOpen(true)}
                  className="text-xs text-zinc-500 transition hover:text-zinc-300"
                >
                  Projects
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="text-xs text-zinc-500 transition hover:text-zinc-300"
                >
                  Settings
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto bg-zinc-900/50 p-4 sm:p-8">
                <FormatPreview
                  rawScript={rawScript}
                  settings={settings}
                  typeOverrides={typeOverrides}
                />
              </div>

              {view === 'split' && (
                <aside className="no-print flex w-72 shrink-0 flex-col border-l border-zinc-800 bg-zinc-950/50 p-4 lg:w-64 xl:w-72">
                  <div className="mb-3 flex gap-1 rounded-lg bg-zinc-900 p-1">
                    <TabButton
                      active={sidebarTab === 'outline'}
                      onClick={() => setSidebarTab('outline')}
                    >
                      Outline
                    </TabButton>
                    <TabButton
                      active={sidebarTab === 'reports'}
                      onClick={() => setSidebarTab('reports')}
                    >
                      Reports
                    </TabButton>
                    <TabButton
                      active={sidebarTab === 'tips'}
                      onClick={() => setSidebarTab('tips')}
                    >
                      Guide
                    </TabButton>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {sidebarTab === 'outline' && (
                      <ScriptOutline
                        rawScript={rawScript}
                        settings={settings}
                        typeOverrides={typeOverrides}
                        onTypeOverride={handleTypeOverride}
                        onLineClick={handleLineClick}
                      />
                    )}
                    {sidebarTab === 'reports' && (
                      <ReportsPanel rawScript={rawScript} settings={settings} />
                    )}
                    {sidebarTab === 'tips' && <FormattingGuide />}
                  </div>
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

      <ProjectsPanel
        open={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        rawScript={rawScript}
        settings={settings}
        typeOverrides={typeOverrides}
        onLoadProject={handleLoadProject}
      />

      <div className="hidden print-only">
        <FormatPreview
          rawScript={rawScript}
          settings={settings}
          typeOverrides={typeOverrides}
        />
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
      className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
        active ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  )
}

function ExportMenu({
  copied,
  exporting,
  onCopy,
  onTxt,
  onDocx,
  onPdf,
  onFountain,
  onFdx,
  onSubmission,
  onPrint,
}: {
  copied: boolean
  exporting: string | null
  onCopy: () => void
  onTxt: () => void
  onDocx: () => void
  onPdf: () => void
  onFountain: () => void
  onFdx: () => void
  onSubmission: () => void
  onPrint: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex items-center gap-2">
      <button type="button" onClick={onCopy} className="btn-secondary">
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary hidden sm:inline-flex"
      >
        Export {exporting ? '…' : '▾'}
      </button>
      <button type="button" onClick={onPrint} className="btn-primary">
        Print
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close export menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
            <ExportItem label=".txt" onClick={() => { onTxt(); setOpen(false) }} />
            <ExportItem
              label=".docx"
              loading={exporting === 'docx'}
              onClick={() => { onDocx(); setOpen(false) }}
            />
            <ExportItem
              label=".pdf"
              loading={exporting === 'pdf'}
              onClick={() => { onPdf(); setOpen(false) }}
            />
            <ExportItem
              label=".fountain"
              loading={exporting === 'fountain'}
              onClick={() => { onFountain(); setOpen(false) }}
            />
            <ExportItem
              label=".fdx"
              loading={exporting === 'fdx'}
              onClick={() => { onFdx(); setOpen(false) }}
            />
            <hr className="my-1 border-zinc-800" />
            <ExportItem
              label="Submission ZIP"
              loading={exporting === 'zip'}
              onClick={() => { onSubmission(); setOpen(false) }}
            />
          </div>
        </>
      )}
    </div>
  )
}

function ExportItem({
  label,
  onClick,
  loading,
}: {
  label: string
  onClick: () => void
  loading?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full px-4 py-2 text-left text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
    >
      {loading ? 'Exporting…' : label}
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
        <GuideItem title="Upload" example=".txt, .docx, .fountain">
          Upload or drag a script file into the editor to convert automatically.
        </GuideItem>
        <GuideItem title="Character names" example="MARCUS">
          Use ALL CAPS on their own line before dialogue.
        </GuideItem>
        <GuideItem title="Modifiers" example="VOICE (V.O.)">
          V.O., O.S., CONT'D, and similar extensions are supported.
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
        <GuideItem title="Lyrics" example='SONG: "Title" / ~lyric line'>
          Musical numbers use song headings and ~ lyric lines.
        </GuideItem>
        <GuideItem title="Transitions" example="FADE OUT.">
          Standard transitions are centered-right automatically.
        </GuideItem>
        <GuideItem title="Shortcuts" example="Ctrl+S / Ctrl+P">
          Save project and print from anywhere in the app.
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
