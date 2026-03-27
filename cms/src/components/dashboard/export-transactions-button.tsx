'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Loader2, FileText, FileSpreadsheet, ChevronDown, Mail } from 'lucide-react'
import { toast } from 'sonner'
import useSWRMutation from 'swr/mutation'

type Format = 'pdf' | 'excel'

export function ExportTransactionsButton() {
  const searchParams = useSearchParams()
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailFormat, setEmailFormat] = useState<Format>('excel')
  const [emailAddress, setEmailAddress] = useState('')

  const buildParams = (extra: Record<string, string>) => {
    const params = new URLSearchParams()
    const filterKeys = ['search', 'status', 'type', 'method', 'link', 'settled', 'ref', 'from', 'to']
    for (const key of filterKeys) {
      const value = searchParams.get(key)
      if (value) params.set(key, value)
    }
    for (const [k, v] of Object.entries(extra)) params.set(k, v)
    return params
  }

  const { trigger: exportTransactions, isMutating: downloading } = useSWRMutation(
    'export-transactions',
    async (_key: string, { arg }: { arg: { format: Format } }) => {
      const params = buildParams({ format: arg.format })
      const res = await fetch(`/dashboard/transactions/export?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || 'Failed to export transactions')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions_export_${Date.now()}.${arg.format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return arg.format
    },
  )

  const { trigger: sendEmail, isMutating: sending } = useSWRMutation(
    'email-transactions',
    async (_key: string, { arg }: { arg: { email: string; format: Format } }) => {
      const params = buildParams({ format: arg.format, email: arg.email })
      const res = await fetch(`/dashboard/transactions/export?${params.toString()}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message || 'Failed to send export')
      return data
    },
  )

  const handleExport = async (format: Format) => {
    try {
      await exportTransactions({ format })
      toast.success(`${format === 'excel' ? 'Excel' : 'PDF'} exported successfully`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to export transactions')
    }
  }

  const openEmailDialog = (format: Format) => {
    setEmailFormat(format)
    setEmailDialogOpen(true)
  }

  const handleSendEmail = async () => {
    if (!emailAddress.trim()) return
    try {
      await sendEmail({ email: emailAddress.trim(), format: emailFormat })
      toast.success(`Export sent to ${emailAddress.trim()}`)
      setEmailDialogOpen(false)
      setEmailAddress('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send export')
    }
  }

  const loading = downloading || sending

  return (
    <>
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openEmailDialog('pdf')}>
            <Mail className="mr-2 h-4 w-4" />
            Send PDF via Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openEmailDialog('excel')}>
            <Mail className="mr-2 h-4 w-4" />
            Send Excel via Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Send {emailFormat === 'excel' ? 'Excel' : 'PDF'} via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="email-address">Email address</Label>
            <Input
              id="email-address"
              type="email"
              placeholder="admin@example.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sending || !emailAddress.trim()}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
