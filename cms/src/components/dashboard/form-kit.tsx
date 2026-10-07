'use client'

import { type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utilities/ui'

/** v4 floating-label field: label sits inside the box above the value. */
export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'flex min-h-[58px] flex-col justify-center gap-0.5 rounded-[14px] bg-card px-3.5 py-2 shadow-[inset_0_0_0_1px_hsl(var(--border))] transition-shadow focus-within:shadow-[inset_0_0_0_2px_hsl(var(--foreground))]',
        className,
      )}
    >
      <span className="text-[12px] text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

/** Input/textarea classes for use inside <Field>. */
export const fieldInputClass =
  'w-full resize-none !border-0 !bg-transparent p-0 text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-[#BFB7AB]'

/** v4 segmented control: fill track, white active segment. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div
      role="radiogroup"
      className="grid gap-1 rounded-[14px] bg-secondary p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-9 rounded-[10px] text-[13.5px] transition-colors',
            value === o.value
              ? 'bg-card font-semibold text-foreground shadow-sm'
              : 'font-medium text-[#4A5361] hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 text-[12px] text-muted-foreground">{children}</p>
}

export type PickedUser = { id: string; name: string; email: string }

/** Selected-user chips plus a search box with a results list (v4 "selected users"). */
export function RecipientPicker({
  selected,
  onRemove,
  query,
  onQuery,
  results,
  onPick,
  searching,
  open,
  setOpen,
  placeholder = 'Search users by name or email',
}: {
  selected: PickedUser[]
  onRemove: (id: string) => void
  query: string
  onQuery: (q: string) => void
  results: PickedUser[]
  onPick: (u: PickedUser) => void
  searching: boolean
  open: boolean
  setOpen: (open: boolean) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2.5">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((u) => (
            <span
              key={u.id}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-card px-3 text-[13.5px] font-medium shadow-[inset_0_0_0_1px_hsl(var(--border))]"
            >
              {u.name || u.email}
              {u.email && u.name && (
                <span className="text-[12px] font-normal text-muted-foreground">({u.email})</span>
              )}
              <button
                type="button"
                aria-label={`Remove ${u.name || u.email}`}
                onClick={() => onRemove(u.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="flex h-11 items-center gap-2 rounded-xl bg-secondary px-3 focus-within:shadow-[inset_0_0_0_2px_hsl(var(--foreground))]">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder={placeholder}
            className="h-full w-full !border-0 !bg-transparent p-0 text-[14px] outline-none placeholder:text-muted-foreground"
          />
          {searching && <span className="text-[11.5px] text-muted-foreground">Searching…</span>}
        </div>

        {open && (results.length > 0 || (query.trim().length >= 2 && !searching)) && (
          <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-[14px] bg-card p-1 shadow-[0_12px_32px_-12px_rgba(27,35,46,0.25),inset_0_0_0_1px_hsl(var(--border))]">
            {results.length === 0 ? (
              <p className="p-3 text-center text-[13px] text-muted-foreground">No users found</p>
            ) : (
              results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPick(u)}
                  className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left hover:bg-secondary"
                >
                  <Initials name={u.name || u.email} seed={u.id} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium">{u.name}</span>
                    <span className="block truncate text-[12px] text-muted-foreground">
                      {u.email}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-[11.5px] text-muted-foreground">
          {selected.length} user{selected.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}

const TINTS = ['#FFE8CC', '#DCE8FF', '#D8F3E4', '#FFDDE0', '#E7E3FF']

export function Initials({ name, seed }: { name: string; seed: string }) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-[#1B232E]"
      style={{ backgroundColor: TINTS[h % TINTS.length] }}
    >
      {initials}
    </span>
  )
}

/** Lock-screen style push preview on an ink panel. */
export function PushPreview({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-[#1B232E] p-8">
      <div className="w-full max-w-[330px] rounded-[18px] bg-[#EEEFF1]/95 p-3.5 shadow-lg">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_icon.png" alt="" className="h-5 w-5 rounded-[5px]" />
          <span className="text-[12.5px] font-semibold text-[#1B232E]">Hogapay</span>
          <span className="ml-auto text-[11.5px] text-[#8B8F96]">now</span>
        </div>
        <p className="mt-2 truncate text-[13px] font-semibold text-[#1B232E]">
          {title || 'Notification title'}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[12.5px] text-[#4A5361]">
          {message || 'Your message shows here.'}
        </p>
      </div>
    </div>
  )
}

/** SMS bubble preview on a fill panel. */
export function SmsPreview({ message }: { message: string }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-2xl bg-secondary p-8">
      <div className="max-w-[280px] whitespace-pre-wrap break-words rounded-[18px] rounded-bl-[6px] bg-card px-3.5 py-2.5 text-[13px] leading-snug text-[#1B232E]">
        {message || 'Your message shows here.'}
      </div>
    </div>
  )
}
