'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Send, Loader2, X } from 'lucide-react'

type Props = {
  to: string
  subject: string
  threadId: string
}

export function InlineReplyBox({ to, subject, threadId }: Props) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [showCc, setShowCc] = useState(false)
  const [cc, setCc] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle "/" shortcut in textarea — focus and show hint
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement === textareaRef.current) {
        // "/" in textarea is just typed normally — no special handling needed
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSend = async () => {
    if (!body.trim() || sending) return
    setSending(true)
    try {
      const ccAddresses = cc.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: [to],
          ...(ccAddresses.length ? { cc: ccAddresses } : {}),
          subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
          bodyText: body.trim(),
          replyToEmailId: threadId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      toast.success('Reply sent')
      setBody('')
      setCc('')
      setShowCc(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white overflow-hidden">
      {/* To row */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
        <Send className="h-3.5 w-3.5 shrink-0 text-gray-300 -rotate-12" />
        <span className="flex-1 text-sm text-gray-600">{to}</span>
        <button
          onClick={() => setShowCc((v) => !v)}
          className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
        >
          Cc
        </button>
      </div>

      {/* Cc row */}
      {showCc && (
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2">
          <span className="text-xs text-gray-400 w-5 shrink-0">Cc</span>
          <input
            autoFocus
            type="text"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="Add cc recipients…"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none"
          />
          {cc && (
            <button onClick={() => setCc('')} className="text-gray-300 hover:text-gray-500">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        placeholder="Write a reply…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={4}
        className="w-full resize-none bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 placeholder:text-gray-300 focus:outline-none"
      />

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
        <span className="text-xs text-gray-300">
          <kbd className="rounded bg-gray-100 px-1.5 py-px font-mono text-[10px] text-gray-400">⌘ Enter</kbd>
          {' '}to send
        </span>

        <button
          onClick={handleSend}
          disabled={!body.trim() || sending}
          className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          Send
        </button>
      </div>
    </div>
  )
}
