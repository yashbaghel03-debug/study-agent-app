'use client'

import { DragEvent, useRef, useState } from 'react'

type FileUploadPanelProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
  isUploading: boolean
  onRemoveFile: (index: number) => void
}

export default function FileUploadPanel({ files, onFilesChange, isUploading, onRemoveFile }: FileUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return
    const nextFiles = Array.from(incoming)
    onFilesChange(nextFiles)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      <div
        className={`rounded-[1.5rem] border border-dashed p-4 text-center transition ${
          isDragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/10 bg-slate-900/70'
        }`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <p className="text-sm font-medium text-slate-200">Drag and drop files here</p>
        <p className="mt-1 text-xs text-slate-400">Images, documents, or other files</p>
        <button
          type="button"
          className="mt-3 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
          onClick={() => inputRef.current?.click()}
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {isUploading ? (
        <div className="flex items-center gap-3 rounded-[1.25rem] border border-cyan-400/20 bg-cyan-500/10 px-3 py-3 text-sm text-cyan-200">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
          Uploading files…
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="rounded-[1.25rem] border border-white/10 bg-[#0d162b]/90 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{file.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button className="text-sm text-slate-400 hover:text-rose-300" onClick={() => onRemoveFile(index)} aria-label={`Remove ${file.name}`}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
