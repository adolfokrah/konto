'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from './data-table/data-table'
import { payoutFeeColumns, type PayoutFeeRow } from './data-table/columns/payout-fee-columns'
import { type BulkAction } from './data-table/types'

const COUNTRIES = [
  { label: 'Ghana', value: 'ghana' },
  { label: 'Nigeria', value: 'nigeria' },
]

type PaymentMethodOption = { id: string; type: string }

type FormState = {
  country: string
  paymentMethodId: string
  fee: string
  hogapaySplit: string
  flatFeeThreshold: string
  flatFee: string
  minimumPayoutAmount: string
}

const empty: FormState = {
  country: 'ghana',
  paymentMethodId: '',
  fee: '',
  hogapaySplit: '',
  flatFeeThreshold: '',
  flatFee: '',
  minimumPayoutAmount: '',
}

export function PayoutFeesDataTable({
  fees,
  paymentMethods,
}: {
  fees: PayoutFeeRow[]
  paymentMethods: PaymentMethodOption[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PayoutFeeRow | null>(null)
  const [editing, setEditing] = useState<PayoutFeeRow | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)

  const openAdd = () => {
    setEditing(null)
    setForm({ ...empty, paymentMethodId: paymentMethods[0]?.id ?? '' })
    setDialogOpen(true)
  }

  const openEdit = (fee: PayoutFeeRow) => {
    setEditing(fee)
    setForm({
      country: fee.country,
      paymentMethodId: fee.paymentMethod?.id ?? '',
      fee: String(fee.fee),
      hogapaySplit: String(fee.hogapaySplit),
      flatFeeThreshold: String(fee.flatFeeThreshold),
      flatFee: String(fee.flatFee),
      minimumPayoutAmount: String(fee.minimumPayoutAmount),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (
      !form.country ||
      !form.paymentMethodId ||
      form.fee === '' ||
      form.hogapaySplit === '' ||
      form.flatFeeThreshold === '' ||
      form.flatFee === '' ||
      form.minimumPayoutAmount === ''
    ) {
      toast.error('All fields are required')
      return
    }
    setSaving(true)
    try {
      const body = {
        country: form.country,
        paymentMethod: form.paymentMethodId,
        fee: parseFloat(form.fee),
        hogapaySplit: parseFloat(form.hogapaySplit),
        flatFeeThreshold: parseFloat(form.flatFeeThreshold),
        flatFee: parseFloat(form.flatFee),
        minimumPayoutAmount: parseFloat(form.minimumPayoutAmount),
      }
      const res = editing
        ? await fetch(`/api/payout-fees/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
          })
        : await fetch('/api/payout-fees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
          })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.errors?.[0]?.message ?? `Failed (${res.status})`)
      }
      toast.success(editing ? 'Fee updated' : 'Fee added')
      setDialogOpen(false)
      startTransition(() => router.refresh())
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/payout-fees/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      toast.success('Fee deleted')
      setDeleteTarget(null)
      startTransition(() => router.refresh())
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const tableMeta = useMemo(() => ({ onEdit: openEdit, onDelete: setDeleteTarget }), [])

  const bulkActions: BulkAction<PayoutFeeRow>[] = useMemo(
    () => [
      {
        label: 'Delete',
        className: 'border-red-800 text-red-400 hover:bg-red-900/20 hover:text-red-300',
        onClick: async (rows, clearSelection) => {
          await Promise.all(
            rows.map((r) =>
              fetch(`/api/payout-fees/${r.id}`, { method: 'DELETE', credentials: 'include' }),
            ),
          )
          clearSelection()
          toast.success(`${rows.length} fee${rows.length !== 1 ? 's' : ''} deleted`)
          startTransition(() => router.refresh())
        },
      },
    ],
    [],
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Payout Fees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {fees.length} rate{fees.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Fee
        </Button>
      </div>

      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader>
          <CardTitle>Payout Fees</CardTitle>
          <CardDescription>
            {fees.length} rate{fees.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DataTable
            tableId="payout-fees"
            columns={payoutFeeColumns}
            data={fees}
            emptyMessage="No payout fees configured yet."
            tableMeta={tableMeta}
            bulkActions={bulkActions}
            fillParent
          />
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Payout Fee' : 'Add Payout Fee'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Country</label>
              <select
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Method</label>
              <select
                value={form.paymentMethodId}
                onChange={(e) => setForm((p) => ({ ...p, paymentMethodId: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.type}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fee (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="1.0"
                  value={form.fee}
                  onChange={(e) => setForm((p) => ({ ...p, fee: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Hogapay Split (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.5"
                  value={form.hogapaySplit}
                  onChange={(e) => setForm((p) => ({ ...p, hogapaySplit: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Flat Fee Threshold</label>
                <Input
                  type="number"
                  step="1"
                  placeholder="100"
                  value={form.flatFeeThreshold}
                  onChange={(e) => setForm((p) => ({ ...p, flatFeeThreshold: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Flat Fee</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="1"
                  value={form.flatFee}
                  onChange={(e) => setForm((p) => ({ ...p, flatFee: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Min Payout</label>
              <Input
                type="number"
                step="0.5"
                placeholder="10"
                value={form.minimumPayoutAmount}
                onChange={(e) => setForm((p) => ({ ...p, minimumPayoutAmount: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payout fee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the fee for{' '}
              <strong>{deleteTarget?.paymentMethod?.type}</strong> in{' '}
              <strong>{COUNTRIES.find((c) => c.value === deleteTarget?.country)?.label}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
