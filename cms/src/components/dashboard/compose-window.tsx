'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Send, Loader2, X, Minus, ChevronUp } from 'lucide-react'
import { cn } from '@/utilities/ui'

type Props = {
  prefill?: {
    to?: string
    subject?: string
    replyToEmailId?: string
  } | null
}

type UserSuggestion = { id: string; email: string; firstName?: string; lastName?: string }

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export function ComposeWindow({ prefill }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const [minimized, setMinimized] = useState(false)
  const [sending, setSending] = useState(false)

  const initialChips = prefill?.to
    ? prefill.to.split(/[\n,]+/).map((e) => e.trim()).filter(Boolean)
    : []

  const [toChips, setToChips] = useState<string[]>(initialChips)
  const [toInput, setToInput] = useState('')
  const [subject, setSubject] = useState(prefill?.subject ?? '')
  const [body, setBody] = useState('')
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [suggestionIndex, setSuggestionIndex] = useState(0)

  useEffect(() => {
    const q = toInput.trim()
    if (!q || q.length < 2) { setSuggestions([]); return }
    const controller = new AbortController()
    fetch(`/api/users?where[or][0][email][like]=${encodeURIComponent(q)}&where[or][1][firstName][like]=${encodeURIComponent(q)}&where[or][2][lastName][like]=${encodeURIComponent(q)}&limit=6`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(d => { setSuggestions(d.docs ?? []); setSuggestionIndex(0) })
      .catch(() => {})
    return () => controller.abort()
  }, [toInput])

  const close = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('compose')
    params.delete('composeTo')
    params.delete('composeSubject')
    params.delete('replyToEmailId')
    const qs = params.toString()
    router.push(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  const addChip = (value: string) => {
    const v = value.trim()
    if (v && !toChips.includes(v)) setToChips((prev) => [...prev, v])
    setToInput('')
    setSuggestions([])
  }

  const pickSuggestion = (user: UserSuggestion) => {
    const label = user.firstName || user.lastName
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() + ` <${user.email}>`
      : user.email
    addChip(label)
  }

  const removeChip = (chip: string) => setToChips((prev) => prev.filter((c) => c !== chip))

  const handleToKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestionIndex(i => Math.min(i + 1, suggestions.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestionIndex(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickSuggestion(suggestions[suggestionIndex]); return }
      if (e.key === 'Escape') { setSuggestions([]); return }
    }
    if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && toInput.trim()) {
      e.preventDefault()
      addChip(toInput)
    }
    if (e.key === 'Backspace' && !toInput && toChips.length > 0) {
      setToChips((prev) => prev.slice(0, -1))
    }
  }

  const isValidChip = (chip: string) => {
    // Accept "Name <email>" format or plain email
    const m = chip.match(/<([^>]+)>$/)
    return m ? isValidEmail(m[1]) : isValidEmail(chip)
  }

  const valid =
    toChips.length > 0 &&
    toChips.every(isValidChip) &&
    subject.trim().length > 0 &&
    body.trim().length > 0

  const handleSend = async () => {
    if (!valid) return
    setSending(true)
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: toChips,
          subject: subject.trim(),
          bodyText: body.trim(),
          ...(prefill?.replyToEmailId ? { replyToEmailId: prefill.replyToEmailId } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      toast.success('Email sent')
      close()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const title = prefill?.replyToEmailId
    ? subject || 'Reply'
    : 'New Message'

  return (
    <div
      className={cn(
        'fixed bottom-0 right-6 z-50 flex w-[480px] flex-col rounded-t-xl border border-b-0 bg-card shadow-2xl transition-all duration-200',
        minimized ? 'h-12' : 'h-[500px]',
      )}
    >
      {/* Window header */}
      <div
        className={cn(
          'flex h-12 shrink-0 cursor-pointer items-center justify-between rounded-t-xl bg-foreground px-4 text-background',
        )}
        onClick={() => minimized && setMinimized(false)}
      >
        <span className="truncate text-[13px] font-medium">{title}</span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMinimized((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/20"
            title={minimized ? 'Expand' : 'Minimise'}
          >
            {minimized ? <ChevronUp className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={close}
            className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/20"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body (hidden when minimized) */}
      {!minimized && (
        <>
          <div className="flex flex-col flex-1 divide-y divide-border/50 overflow-hidden">
            {/* To */}
            <div className="relative flex min-h-10 items-start gap-2 px-3 py-2">
              <span className="mt-1.5 w-10 shrink-0 text-xs text-muted-foreground">To</span>
              <div className="flex flex-1 flex-wrap items-center gap-1">
                {toChips.map((chip) => (
                  <span
                    key={chip}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      isValidChip(chip) ? 'bg-muted text-foreground' : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {chip}
                    <button onClick={() => removeChip(chip)} className="opacity-60 hover:opacity-100">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  className="min-w-24 flex-1 bg-transparent text-sm placeholder:text-muted-foreground/40 focus:outline-none"
                  placeholder={toChips.length === 0 ? 'Recipients…' : ''}
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  onKeyDown={handleToKeyDown}
                  onBlur={() => { setTimeout(() => { if (!suggestionsRef.current?.matches(':hover')) { setSuggestions([]); if (toInput.trim()) addChip(toInput) } }, 150) }}
                />
              </div>
              {suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute left-0 right-0 top-full z-50 mt-0.5 overflow-hidden rounded-lg border bg-popover shadow-lg"
                >
                  {suggestions.map((u, i) => (
                    <button
                      key={u.id}
                      onMouseDown={(e) => { e.preventDefault(); pickSuggestion(u) }}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted',
                        i === suggestionIndex && 'bg-muted',
                      )}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || u.email[0].toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        {(u.firstName || u.lastName) && (
                          <p className="truncate text-xs font-medium">{`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()}</p>
                        )}
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="w-10 shrink-0 text-xs text-muted-foreground">Subj</span>
              <input
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/40 focus:outline-none"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              <textarea
                ref={bodyRef}
                className="h-full w-full resize-none bg-transparent px-3 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none"
                placeholder="Write your message…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-3 py-2.5 shrink-0">
            <button
              onClick={close}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSend}
              disabled={!valid || sending}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                valid && !sending
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}
