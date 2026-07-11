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
import { useIsAdmin } from './dashboard-user-context'

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  'under-review': 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export function BusinessVerificationStatusForm({
  verificationId,
  currentStatus,
  rejectionReason,
  reviewedBy,
}: {
  verificationId: string
  currentStatus: string
  rejectionReason: string
  reviewedBy: { id: string; name: string } | null
}) {
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const isFinal = ['approved', 'rejected'].includes(currentStatus)
  const needsReason = newStatus === 'rejected'

  // Options: allow progressing to under-review, approved, or rejected
  const options = [
    currentStatus === 'pending' && { value: 'under-review', label: 'Under Review' },
    currentStatus !== 'approved' && { value: 'approved', label: 'Approved' },
    currentStatus !== 'rejected' && { value: 'rejected', label: 'Rejected' },
  ].filter(Boolean) as { value: string; label: string }[]

  const handleSave = async () => {
    if (!newStatus) return
    setSaving(true)
    try {
      const body: Record<string, any> = { status: newStatus }
      if (needsReason && reason.trim()) {
        body.rejectionReason = reason.trim()
        body._statusChangeReason = reason.trim()
      }

      const res = await fetch(`/api/business-verifications/${verificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success('Status updated')
      router.refresh()
      setNewStatus('')
      setReason('')
    } catch {
      toast.error('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm py-1">
        <span className="text-muted-foreground">Current</span>
        <span className="font-medium">{statusLabel[currentStatus] ?? currentStatus}</span>
      </div>

      {reviewedBy && (
        <>
          <Separator />
          <div className="flex justify-between text-sm py-1">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Reviewed By
            </span>
            <Link href={`/dashboard/users/${reviewedBy.id}`} className="font-medium hover:underline">
              {reviewedBy.name}
            </Link>
          </div>
        </>
      )}

      {rejectionReason && (
        <div className="rounded-md bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground mb-0.5">Rejection Reason</p>
          <p className="text-sm leading-relaxed">{rejectionReason}</p>
        </div>
      )}

      {!isFinal && options.length > 0 && (
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

            {needsReason && (
              <Textarea
                placeholder="Rejection reason…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
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
