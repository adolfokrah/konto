'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, X } from 'lucide-react'
import { cn } from '@/utilities/ui'

type Props = {
  prefill?: {
    to?: string
    subject?: string
    body?: string
    replyToEmailId?: string
  } | null
}

export function ComposeEmailForm({ prefill }: Props) {
  const router = useRouter()
  const [toInput, setToInput] = useState(prefill?.to ?? '')
  const [subject, setSubject] = useState(prefill?.subject ?? '')
  const [body, setBody] = useState(prefill?.body ?? '')
  const [sending, setSending] = useState(false)

  // Parse comma/newline separated email addresses
  const toAddresses = toInput
    .split(/[\n,]+/)
    .map((e) => e.trim())
    .filter(Boolean)

  const valid =
    toAddresses.length > 0 &&
    toAddresses.every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) &&
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
          to: toAddresses,
          subject: subject.trim(),
          bodyText: body.trim(),
          ...(prefill?.replyToEmailId ? { replyToEmailId: prefill.replyToEmailId } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      toast.success('Email sent successfully')
      router.push(`/dashboard/emails/${data.id}`)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {prefill?.replyToEmailId ? 'Reply' : 'New Email'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* To */}
        <div className="space-y-1.5">
          <Label htmlFor="to">To</Label>
          <div className="relative">
            <Input
              id="to"
              placeholder="recipient@example.com, another@example.com"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              className="pr-8"
            />
            {toInput && (
              <button
                onClick={() => setToInput('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {toAddresses.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {toAddresses.map((addr, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs',
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)
                      ? 'bg-primary/10 text-primary'
                      : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {addr}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            placeholder="Write your message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="resize-none font-mono text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={() => router.back()} disabled={sending}>
            Discard
          </Button>
          <Button onClick={handleSend} disabled={!valid || sending}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
