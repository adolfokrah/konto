'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '@/utilities/ui'

interface ImageDropZoneProps {
  value: File[]
  onChange: (files: File[]) => void
  maxFiles?: number
  className?: string
}

export function ImageDropZone({ value, onChange, maxFiles = 5, className }: ImageDropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)

  // Sync object URL previews with value
  useEffect(() => {
    const urls = value.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [value])

  const addFiles = (incoming: File[]) => {
    const images = incoming.filter((f) => f.type.startsWith('image/'))
    if (!images.length) return
    onChange([...value, ...images].slice(0, maxFiles))
  }

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  // Paste — only when the zone or its children are focused, or globally when focused
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.items || [])
        .filter((item) => item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null)
      if (!files.length) return
      e.preventDefault()
      addFiles(files)
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [value, maxFiles])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only trigger if leaving the zone entirely (not a child)
    if (!zoneRef.current?.contains(e.relatedTarget as Node)) {
      setDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []))
    if (inputRef.current) inputRef.current.value = ''
  }

  const remaining = maxFiles - value.length

  return (
    <div className={cn('space-y-2', className)}>
      {/* Thumbnails */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative group w-16 h-16 rounded-md overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={value[i]?.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {remaining > 0 && (
        <div
          ref={zoneRef}
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors',
            dragging
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/40',
          )}
        >
          <ImagePlus className="h-5 w-5" />
          <p className="text-xs font-medium">
            {dragging ? 'Drop to add' : 'Drop, paste, or click to browse'}
          </p>
          <p className="text-[11px] opacity-60">
            {remaining} of {maxFiles} remaining · images only
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
