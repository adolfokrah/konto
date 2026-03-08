'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Loader2, RefreshCw, Wallet, Landmark, Plus, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json())

interface TopupRow {
  id: string
  amount: number
  phoneNumber: string
  accountName: string
  provider: string
  status: string
  transactionReference: string
  createdAt: string
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalRows: number
  rowsPerPage: number
}

interface Props {
  initialCollectionBalance: number | null
  initialPayoutBalance: number | null
  topups: TopupRow[]
  pagination: Pagination
}

type DialogStep = 'form' | 'waiting' | 'success' | 'failed'

export function LedgerClient({ initialCollectionBalance, initialPayoutBalance, topups, pagination }: Props) {
  const router = useRouter()

  const [collectionBalance, setCollectionBalance] = useState<number | null>(initialCollectionBalance)
  const [payoutBalance, setPayoutBalance] = useState<number | null>(initialPayoutBalance)
  const [loadingBalances, setLoadingBalances] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogStep, setDialogStep] = useState<DialogStep>('form')
  const [amount, setAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [provider, setProvider] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [waitingTopupId, setWaitingTopupId] = useState<string | null>(null)

  // SWR polls the specific top-up status only while waiting
  const { data: topupStatus } = useSWR(
    waitingTopupId ? `/api/ledger-topups/${waitingTopupId}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      onSuccess: (data) => {
        if (data?.status === 'completed') {
          setDialogStep('success')
          setWaitingTopupId(null)
          refreshBalances()
          router.refresh()
        } else if (data?.status === 'failed') {
          setDialogStep('failed')
          setWaitingTopupId(null)
        }
      },
    },
  )

  const refreshBalances = async () => {
    setLoadingBalances(true)
    try {
      const res = await fetch('/api/eganow-balances', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setCollectionBalance(data.collectionBalance)
        setPayoutBalance(data.payoutBalance)
      }
    } catch {
      // silent
    } finally {
      setLoadingBalances(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset dialog state when closing
      setDialogStep('form')
      setWaitingTopupId(null)
      setAmount('')
      setPhoneNumber('')
      setProvider('')
      if (dialogStep === 'success') {
        router.refresh()
      }
    }
    setDialogOpen(open)
  }

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || !phoneNumber || !provider) {
      toast.error('Please fill in all fields')
      return
    }

    if (Number(amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/ledger-topups/initiate-topup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          phoneNumber,
          provider,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setWaitingTopupId(data.data?.topupId || null)
        setDialogStep('waiting')
      } else {
        toast.error(data.message || 'Top-up failed')
      }
    } catch {
      toast.error('Failed to initiate top-up')
    } finally {
      setSubmitting(false)
    }
  }

  const formatBalance = (val: number | null) => {
    if (val === null) return '—'
    return `GHS ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={cn('capitalize border-0', variants[status] || 'bg-gray-100 text-gray-800')}>
        {status}
      </Badge>
    )
  }

  const momoSteps = provider === 'telecel'
    ? ['Dial *110#', 'Select Telecel Cash', 'Select Approvals', 'Select the pending request', 'Enter your PIN to confirm']
    : ['Dial *170#', 'Select My Wallet', 'Select My Approvals', 'Select the pending request', 'Enter your PIN to confirm']

  const renderDialogContent = () => {
    if (dialogStep === 'waiting') {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Complete Authorization</DialogTitle>
            <DialogDescription>
              A payment prompt has been sent to your phone. Please approve it.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-6 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Waiting for approval...</p>
            <p className="text-xs text-muted-foreground">Don&apos;t close this page</p>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <p className="text-sm font-medium">Didn&apos;t get a prompt?</p>
            <ol className="space-y-2">
              {momoSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </>
      )
    }

    if (dialogStep === 'success') {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Top-Up Successful</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-8 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-sm font-medium">Your collection balance has been topped up</p>
            <p className="text-2xl font-bold">GHS {Number(amount).toFixed(2)}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => handleDialogClose(false)}>Done</Button>
          </DialogFooter>
        </>
      )
    }

    if (dialogStep === 'failed') {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Top-Up Failed</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-8 space-y-3">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-sm text-muted-foreground">
              The payment was declined or timed out. Please try again.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>Close</Button>
            <Button onClick={() => setDialogStep('form')}>Try Again</Button>
          </DialogFooter>
        </>
      )
    }

    // form step
    return (
      <>
        <DialogHeader>
          <DialogTitle>Top Up Collection Balance</DialogTitle>
          <DialogDescription>
            Initiate a mobile money collection to top up your Eganow collection balance
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleTopup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (GHS)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="0241234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={setProvider} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mtn">MTN</SelectItem>
                <SelectItem value="telecel">Telecel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Initiating...' : 'Top Up'}
            </Button>
          </DialogFooter>
        </form>
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Eganow Balances */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBalance(collectionBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Funds received from mobile money collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payout Balance</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBalance(payoutBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available balance for payouts
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={refreshBalances} disabled={loadingBalances}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loadingBalances && 'animate-spin')} />
          Refresh
        </Button>

        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Top Up
            </Button>
          </DialogTrigger>
          <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            {renderDialogContent()}
          </DialogContent>
        </Dialog>
      </div>

      {/* Top-Up Records */}
      <Card>
        <CardHeader>
          <CardTitle>Top-Up Records</CardTitle>
          <CardDescription>
            {pagination.totalRows} record{pagination.totalRows !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No top-up records yet
                  </TableCell>
                </TableRow>
              ) : (
                topups.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      GHS {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{t.phoneNumber}</TableCell>
                    <TableCell>{t.accountName}</TableCell>
                    <TableCell className="uppercase">{t.provider}</TableCell>
                    <TableCell>{statusBadge(t.status)}</TableCell>
                    <TableCell className="font-mono text-xs">{t.transactionReference}</TableCell>
                    <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => router.push(`?page=${pagination.currentPage - 1}`)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => router.push(`?page=${pagination.currentPage + 1}`)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
