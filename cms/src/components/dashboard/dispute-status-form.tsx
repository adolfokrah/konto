'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

const statusLabel: Record<string, string> = {
  open: 'Open',
  'under-review': 'Under Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
}

export function DisputeStatusForm({
  disputeId,
  currentStatus,
  resolutionNote,
  resolvedBy,
}: {
  disputeId: string
  currentStatus: string
  resolutionNote: string
  resolvedBy: { id: string; name: string } | null
}) {
  const router = useRouter()
  const [newStatus, setNewStatus] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const isResolved = ['resolved', 'rejected'].includes(currentStatus)
  const needsNote = ['resolved', 'rejected'].includes(newStatus)

  // Options: always allow moving to under-review if open, or to resolved/rejected
  const options = [
    currentStatus === 'open' && { value: 'under-review', label: 'Under Review' },
    currentStatus !== 'resolved' && { value: 'resolved', label: 'Resolved' },
    currentStatus !== 'rejected' && { value: 'rejected', label: 'Rejected' },
  ].filter(Boolean) as { value: string; label: string }[]

  const handleSave = async () => {
    if (!newStatus) return
    setSaving(true)
    try {
      const body: Record<string, any> = { status: newStatus }
      if (needsNote && note.trim()) body.resolutionNote = note.trim()

      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success('Status updated')
      router.refresh()
      setNewStatus('')
      setNote('')
    } catch {
      toast.error('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm py-1">
        <span className="text-muted-foreground">Current</span>
        <span className="font-medium">{statusLabel[currentStatus] ?? currentStatus}</span>
      </div>

      {resolvedBy && (
        <>
          <Separator />
          <div className="flex justify-between text-sm py-1">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {currentStatus === 'resolved' ? 'Resolved By' : 'Rejected By'}
            </span>
            <Link href={`/dashboard/users/${resolvedBy.id}`} className="font-medium hover:underline">
              {resolvedBy.name}
            </Link>
          </div>
        </>
      )}

      {resolutionNote && (
        <div className="rounded-md bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">Resolution Note</p>
          <p className="text-sm leading-relaxed">{resolutionNote}</p>
        </div>
      )}

      {!isResolved && options.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2 pt-1">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Change status to…" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {needsNote && (
              <Textarea
                placeholder="Resolution note (optional)…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            )}

            <Button className="w-full" disabled={!newStatus || saving} onClick={handleSave}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
