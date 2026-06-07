import { useState } from 'react'
import type { FormatSettings, ScriptProject, TypeOverrides } from '../types/script'
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
  onLoadProject: (project: ScriptProject) => void
}

export function ProjectsPanel({
  open,
  onClose,
  rawScript,
  settings,
  typeOverrides,
  onLoadProject,
}: ProjectsPanelProps) {
  const [projects, setProjects] = useState(listProjects)
  const [newName, setNewName] = useState('')

  if (!open) return null

  const refresh = () => setProjects(listProjects())

  const handleSave = () => {
    const name = newName.trim() || settings.titlePage.title || 'Untitled Play'
    const project = createProject(name, rawScript, settings, typeOverrides)
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
      <aside className="relative h-full w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Projects</h2>
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
            className="input-field flex-1"
          />
          <button type="button" onClick={handleSave} className="btn-primary shrink-0">
            Save
          </button>
        </div>

        <ul className="space-y-2">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3"
            >
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
                onClick={() => handleDelete(project.id)}
                className="shrink-0 text-xs text-red-400/80 transition hover:text-red-300"
              >
                Delete
              </button>
            </li>
          ))}
          {projects.length === 0 && (
            <li className="py-8 text-center text-sm text-zinc-600">
              No saved projects yet.
            </li>
          )}
        </ul>
      </aside>
    </div>
  )
}
