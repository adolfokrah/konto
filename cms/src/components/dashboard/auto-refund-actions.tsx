'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type Props = {
  jarId: string
}

export function AutoRefundActions({ jarId }: Props) {
  const router = useRouter()
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const handleApprove = async () => {
    setApproving(true)
    try {
      const res = await fetch('/api/refunds/approve-auto-refunds', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jarId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Refunds approved and queued')
        router.refresh()
      } else {
        toast.error(data.message || 'Failed to approve refunds')
      }
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    setRejecting(true)
    try {
      const res = await fetch('/api/refunds/reject-auto-refunds', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jarId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Refunds rejected. Jar unfrozen.')
        router.refresh()
      } else {
        toast.error(data.message || 'Failed to reject refunds')
      }
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred')
    } finally {
      setRejecting(false)
    }
  }

  const busy = approving || rejecting

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="default" disabled={busy} onClick={handleApprove}>
        {approving ? 'Approving...' : 'Approve'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={handleReject}
        className="text-destructive hover:text-destructive"
      >
        {rejecting ? 'Rejecting...' : 'Reject'}
      </Button>
    </div>
  )
}
