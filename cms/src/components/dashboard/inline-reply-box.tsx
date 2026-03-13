'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Send, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/utilities/ui'

type Props = {
  to: string
  subject: string
  threadId: string
}

export function InlineReplyBox({ to, subject, threadId }: Props) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [focused, setFocused] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!body.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: [to],
          subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
          bodyText: body.trim(),
          replyToEmailId: threadId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      toast.success('Reply sent')
      setBody('')
      setFocused(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={cn(
      'rounded-xl border bg-card transition-shadow duration-200',
      focused ? 'shadow-md ring-1 ring-ring/20' : 'shadow-sm',
    )}>
      {/* To row */}
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">To</span>
        <span className="flex-1 text-xs text-foreground">{to}</span>
        <button
          onClick={() => setFocused(false)}
          className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <textarea
        placeholder="Write a reply…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => setFocused(true)}
        rows={focused ? 5 : 2}
        className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none"
      />

      {/* Footer */}
      {focused && (
        <div className="flex items-center justify-between border-t px-4 py-2.5">
          <button
            onClick={() => { setBody(''); setFocused(false) }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSend}
            disabled={!body.trim() || sending}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
              body.trim() && !sending
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'cursor-not-allowed bg-muted text-muted-foreground',
            )}
          >
            {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send
          </button>
        </div>
      )}
    </div>
  )
}
