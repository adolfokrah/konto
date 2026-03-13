'use client'

import { useState } from 'react'
import { GitMerge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function RethreadEmailsButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const rethread = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/emails/rethread', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Rethread failed')
      toast.success(`Threaded ${data.updated} email${data.updated !== 1 ? 's' : ''}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Rethread failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={rethread}
      disabled={loading}
      title="Re-group emails into threads"
    >
      <GitMerge className={`h-3.5 w-3.5 ${loading ? 'animate-pulse' : ''}`} />
    </Button>
  )
}
