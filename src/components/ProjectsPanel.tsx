import { useState } from 'react'
import { useModal } from '../hooks/useModal'
import type { CastMetadata, FormatSettings, ScriptProject, TypeOverrides } from '../types/script'
import {
  createProject,
  deleteProject,
  listProjects,
  saveProject,
} from '../lib/storage'

interface ProjectsPanelProps {
  open: boolean
  onClose: () => void
  rawScript: string
  settings: FormatSettings
  typeOverrides: TypeOverrides
  castMetadata: CastMetadata
  onLoadProject: (project: ScriptProject) => void
}

export function ProjectsPanel({
  open,
  onClose,
  rawScript,
  settings,
  typeOverrides,
  castMetadata,
  onLoadProject,
}: ProjectsPanelProps) {
  const panelRef = useModal<HTMLElement>(open, onClose)
  const [projects, setProjects] = useState(listProjects)
  const [newName, setNewName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  if (!open) return null

  const refresh = () => setProjects(listProjects())

  const handleSave = () => {
    const name = newName.trim() || settings.titlePage.title || 'Untitled Play'
    const project = createProject(name, rawScript, settings, typeOverrides, castMetadata)
    saveProject(project)
    setNewName('')
    refresh()
  }

  const handleLoad = (project: ScriptProject) => {
    onLoadProject(project)
    onClose()
  }

  const handleDelete = (id: string) => {
    deleteProject(id)
    setConfirmDeleteId(null)
    refresh()
  }

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close projects"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="projects-panel-title"
        className="relative h-full w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="projects-panel-title" className="text-lg font-semibold text-white">
            Projects
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name…"
            aria-label="Project name"
            className="input-field flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
          />
          <button type="button" onClick={handleSave} className="btn-primary shrink-0">
            Save
          </button>
        </div>

        <p className="mb-4 text-xs text-zinc-500">
          Drafts autosave in your browser. Save here to keep named versions.
        </p>

        <ul className="space-y-2">
          {projects.map((project) => (
            <li
              key={project.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3"
            >
              {confirmDeleteId === project.id ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-300">
                    Delete <span className="font-medium text-white">{project.name}</span>?
                    This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id)}
                      className="rounded-md bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoad(project)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {project.name}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {new Date(project.updatedAt).toLocaleString()}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(project.id)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs text-red-400/80 transition hover:bg-red-500/10 hover:text-red-300"
                    aria-label={`Delete ${project.name}`}
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
          {projects.length === 0 && (
            <li className="rounded-lg border border-dashed border-zinc-800 py-10 text-center">
              <p className="text-sm text-zinc-500">No saved projects yet</p>
              <p className="mt-1 text-xs text-zinc-600">
                Name your play above and click Save to keep a copy.
              </p>
            </li>
          )}
        </ul>
      </aside>
    </div>
  )
}
