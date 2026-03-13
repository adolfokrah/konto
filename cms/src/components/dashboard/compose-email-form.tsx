'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Send, Loader2, X, ArrowLeft } from 'lucide-react'
import { cn } from '@/utilities/ui'

type Props = {
  prefill?: {
    to?: string
    subject?: string
    body?: string
    replyToEmailId?: string
  } | null
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export function ComposeEmailForm({ prefill }: Props) {
  const router = useRouter()
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  // Parse prefilled "to" string into initial chips
  const initialChips = prefill?.to
    ? prefill.to.split(/[\n,]+/).map(e => e.trim()).filter(Boolean)
    : []

  const [toChips, setToChips] = useState<string[]>(initialChips)
  const [toInput, setToInput] = useState('')
  const [subject, setSubject] = useState(prefill?.subject ?? '')
  const [body, setBody] = useState(prefill?.body ?? '')
  const [sending, setSending] = useState(false)

  const addChip = (value: string) => {
    const v = value.trim()
    if (v && !toChips.includes(v)) setToChips(prev => [...prev, v])
    setToInput('')
  }

  const removeChip = (chip: string) => setToChips(prev => prev.filter(c => c !== chip))

  const handleToKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ' || e.key === 'Tab') && toInput.trim()) {
      e.preventDefault()
      addChip(toInput)
    }
    if (e.key === 'Backspace' && !toInput && toChips.length > 0) {
      setToChips(prev => prev.slice(0, -1))
    }
  }

  const valid =
    toChips.length > 0 &&
    toChips.every(isValidEmail) &&
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
      router.push(`/dashboard/emails/${data.id}`)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-sm font-semibold">
            {prefill?.replyToEmailId ? 'Reply' : 'New message'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => router.back()}>
            Discard
          </Button>
          <Button onClick={handleSend} disabled={!valid || sending} size="sm" className="h-8 gap-1.5 text-xs">
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send
          </Button>
        </div>
      </div>

      {/* Form fields */}
      <div className="flex flex-col flex-1 overflow-hidden divide-y divide-border/60">
        {/* To field */}
        <div className="flex items-start gap-3 px-4 py-3 min-h-[48px]">
          <span className="mt-1.5 w-14 shrink-0 text-xs font-medium text-muted-foreground">To</span>
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {toChips.map((chip) => (
              <span
                key={chip}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                  isValidEmail(chip)
                    ? 'bg-muted text-foreground'
                    : 'bg-destructive/10 text-destructive',
                )}
              >
                {chip}
                <button onClick={() => removeChip(chip)} className="hover:text-foreground/60">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              className="min-w-[160px] flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
              placeholder={toChips.length === 0 ? 'Recipients…' : 'Add more…'}
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              onKeyDown={handleToKeyDown}
              onBlur={() => toInput.trim() && addChip(toInput)}
            />
          </div>
        </div>

        {/* Subject field */}
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">Subject</span>
          <input
            className="flex-1 bg-transparent text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* Body */}
        <div className="relative flex flex-1 flex-col px-4 py-4 overflow-hidden">
          <textarea
            ref={bodyRef}
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none"
            placeholder="Write your message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {/* Bottom signature divider */}
          <div className="mt-4 border-t border-border/40 pt-3">
            <p className="text-xs text-muted-foreground/40">Sent via Hogapay Admin</p>
          </div>
        </div>
      </div>
    </div>
  )
}
