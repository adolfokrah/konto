'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export function SyncEmailsButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const sync = useCallback(async (silent = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/emails/sync', { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      if (!silent || data.imported > 0) {
        toast.success(`Synced ${data.imported} new email${data.imported !== 1 ? 's' : ''}`, {
          description: data.skipped > 0 ? `${data.skipped} already in inbox` : undefined,
        })
      }
      if (data.imported > 0) router.refresh()
    } catch (err: any) {
      if (!silent) toast.error(err.message ?? 'Sync failed')
    } finally {
      setLoading(false)
    }
  }, [loading, router])

  const syncRef = useRef(sync)
  useEffect(() => { syncRef.current = sync }, [sync])

  // Auto-sync every 5 minutes (interval created once, always calls latest sync via ref)
  useEffect(() => {
    const id = setInterval(() => syncRef.current(true), SYNC_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => sync(false)} disabled={loading} title="Sync received emails (auto every 5 min)">
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
    </Button>
  )
}
