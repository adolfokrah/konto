'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useIsAdmin } from './dashboard-user-context'

export function DbBackupButton() {
  const [loading, setLoading] = useState(false)
  const isAdmin = useIsAdmin()

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/db-backup')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message ?? 'Backup failed')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().split('T')[0]
      a.href = url
      a.download = `hogapay-db-backup-${date}.gz`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Backup downloaded')
    } catch (err: any) {
      toast.error(err.message ?? 'Backup failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) return null

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading}>
      <Download className="w-4 h-4 mr-2" />
      {loading ? 'Preparing backup...' : 'Download DB Backup'}
    </Button>
  )
}
