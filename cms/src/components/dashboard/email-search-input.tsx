'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

type Props = {
  tab: string
  defaultValue?: string
}

export function EmailSearchInput({ tab, defaultValue = '' }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navigate = (search: string) => {
    const params = new URLSearchParams()
    params.set('tab', tab)
    if (search) params.set('search', search)
    router.push(`?${params.toString()}`)
  }

  const handleChange = (next: string) => {
    setValue(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => navigate(next), 350)
  }

  const handleClear = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setValue('')
    navigate('')
    inputRef.current?.focus()
  }

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  return (
    <div className="relative flex items-center">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (timerRef.current) clearTimeout(timerRef.current)
            navigate(value)
          }
          if (e.key === 'Escape') handleClear()
        }}
        placeholder="Search…"
        className="h-10 w-full rounded-xl !border-0 !bg-secondary pl-8 pr-7 text-[13.5px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1B232E]"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
