import { useCallback, useRef, useState } from 'react'
import {
  getAcceptedFileTypes,
  importScriptFile,
  isSupportedScriptFile,
} from '../lib/importScript'

interface ScriptUploadProps {
  onImport: (text: string, filename: string) => void
  onLoadSample?: () => void
  children: React.ReactNode
}

export function ScriptUpload({ onImport, onLoadSample, children }: ScriptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(
    async (file: File) => {
      setUploading(true)
      setError(null)

      const result = await importScriptFile(file)

      setUploading(false)

      if ('message' in result) {
        setError(result.message)
        return
      }

      onImport(result.text, result.filename)
    },
    [onImport],
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (!file) return
      void processFile(file)
    },
    [processFile],
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setDragging(false)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (!file) return
      if (!isSupportedScriptFile(file)) {
        setError(`Unsupported file type. Use ${getAcceptedFileTypes()}.`)
        return
      }
      void processFile(file)
    },
    [processFile],
  )

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={getAcceptedFileTypes()}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Raw Script
        </h2>
        <div className="flex items-center gap-3">
          {uploading && (
            <span className="text-xs text-amber-400" role="status" aria-live="polite">
              Converting…
            </span>
          )}
          {onLoadSample && (
            <button
              type="button"
              onClick={onLoadSample}
              className="text-xs text-zinc-500 transition hover:text-zinc-300"
            >
              Load sample
            </button>
          )}
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="text-xs text-amber-500/80 transition hover:text-amber-400 disabled:opacity-50"
          >
            Upload file
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mx-4 mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
        >
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {children}

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-amber-500/60 bg-amber-500/10 backdrop-blur-[1px]">
          <p className="text-sm font-medium text-amber-200">
            Drop script to convert
          </p>
        </div>
      )}
    </div>
  )
}
