'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import useSWRMutation from 'swr/mutation'

export function ExportUsersButton() {
  const searchParams = useSearchParams()

  const { trigger: exportUsers, isMutating: loading } = useSWRMutation(
    'export-users',
    async () => {
      const params = new URLSearchParams()
      const filterKeys = ['search', 'kyc', 'role']
      for (const key of filterKeys) {
        const value = searchParams.get(key)
        if (value) params.set(key, value)
      }

      const res = await fetch(`/dashboard/users/export?${params.toString()}`)

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || 'Failed to export users')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_export_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  )

  const handleExport = async () => {
    try {
      await exportUsers()
      toast.success('Excel exported successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to export users')
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={loading} onClick={handleExport}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Export
    </Button>
  )
}
