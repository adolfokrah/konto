'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Loader2, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

export function ExportTransactionsButton() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  const handleExport = async (format: 'pdf' | 'excel') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const filterKeys = ['search', 'status', 'type', 'method', 'link', 'settled', 'ref', 'from', 'to']
      for (const key of filterKeys) {
        const value = searchParams.get(key)
        if (value) params.set(key, value)
      }
      params.set('format', format)

      const res = await fetch(`/dashboard/transactions/export?${params.toString()}`)

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.message || 'Failed to export transactions')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions_export_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`${format === 'excel' ? 'Excel' : 'PDF'} exported successfully`)
    } catch {
      toast.error('Failed to export transactions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
