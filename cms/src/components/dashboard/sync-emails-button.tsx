'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function SyncEmailsButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const sync = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/emails/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      toast.success(`Synced ${data.imported} new email${data.imported !== 1 ? 's' : ''}`, {
        description: data.skipped > 0 ? `${data.skipped} already in inbox` : undefined,
      })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={sync} disabled={loading} title="Sync received emails from Resend">
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
    </Button>
  )
}
