import type { FormatSettings, ScriptProject, TypeOverrides } from '../types/script'
import { DEFAULT_SETTINGS } from '../types/script'

const DRAFT_KEY = 'stagecraft-draft'
const PROJECTS_KEY = 'stagecraft-projects'
const ACTIVE_PROJECT_KEY = 'stagecraft-active-project'

export interface DraftState {
  rawScript: string
  settings: FormatSettings
  typeOverrides: TypeOverrides
  savedAt: number
}

export function saveDraft(
  rawScript: string,
  settings: FormatSettings,
  typeOverrides: TypeOverrides,
): void {
  const draft: DraftState = {
    rawScript,
    settings,
    typeOverrides,
    savedAt: Date.now(),
  }
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // storage full or unavailable
  }
}

export function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as DraftState
    return {
      ...draft,
      settings: { ...DEFAULT_SETTINGS, ...draft.settings },
      typeOverrides: draft.typeOverrides ?? {},
    }
  } catch {
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
}

export function listProjects(): ScriptProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ScriptProject[]
  } catch {
    return []
  }
}

export function saveProject(project: ScriptProject): void {
  const projects = listProjects()
  const idx = projects.findIndex((p) => p.id === project.id)
  const updated = { ...project, updatedAt: Date.now() }
  if (idx >= 0) {
    projects[idx] = updated
  } else {
    projects.unshift(updated)
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.slice(0, 50)))
}

export function deleteProject(id: string): void {
  const projects = listProjects().filter((p) => p.id !== id)
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_PROJECT_KEY)
}

export function setActiveProjectId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id)
  } else {
    localStorage.removeItem(ACTIVE_PROJECT_KEY)
  }
}

export function createProject(
  name: string,
  rawScript: string,
  settings: FormatSettings,
  typeOverrides: TypeOverrides = {},
): ScriptProject {
  return {
    id: crypto.randomUUID(),
    name,
    rawScript,
    settings,
    typeOverrides,
    updatedAt: Date.now(),
  }
}
