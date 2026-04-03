'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { paymentMethodColumns, type PaymentMethodRow } from './data-table/columns/payment-method-columns'
import { type BulkAction } from './data-table/types'

const COUNTRIES = [
  { label: 'Ghana', value: 'ghana' },
  { label: 'Nigeria', value: 'nigeria' },
]

type FormState = { type: string; country: string; isActive: boolean }
const empty: FormState = { type: '', country: 'ghana', isActive: true }

export function PaymentMethodsDataTable({ methods }: { methods: PaymentMethodRow[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethodRow | null>(null)
  const [editing, setEditing] = useState<PaymentMethodRow | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)

  const openAdd = () => {
    setEditing(null)
    setForm(empty)
    setDialogOpen(true)
  }

  const openEdit = (pm: PaymentMethodRow) => {
    setEditing(pm)
    setForm({ type: pm.type, country: pm.country, isActive: pm.isActive })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.type.trim() || !form.country) {
      toast.error('Type and country are required')
      return
    }
    setSaving(true)
    try {
      const body = { type: form.type.trim(), country: form.country, isActive: form.isActive }
      const res = editing
        ? await fetch(`/api/payment-methods/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
          })
        : await fetch('/api/payment-methods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
          })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.errors?.[0]?.message ?? `Failed (${res.status})`)
      }
      toast.success(editing ? 'Payment method updated' : 'Payment method added')
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
      const res = await fetch(`/api/payment-methods/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      toast.success('Payment method deleted')
      setDeleteTarget(null)
      startTransition(() => router.refresh())
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const bulkActions: BulkAction<PaymentMethodRow>[] = useMemo(
    () => [
      {
        label: 'Activate',
        className: 'border-green-800 text-green-400 hover:bg-green-900/20 hover:text-green-300',
        onClick: async (rows, clearSelection) => {
          await Promise.all(
            rows.map((pm) =>
              fetch(`/api/payment-methods/${pm.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isActive: true }),
              }),
            ),
          )
          clearSelection()
          toast.success(`${rows.length} method${rows.length !== 1 ? 's' : ''} activated`)
          startTransition(() => router.refresh())
        },
      },
      {
        label: 'Deactivate',
        className: 'border-yellow-800 text-yellow-400 hover:bg-yellow-900/20 hover:text-yellow-300',
        onClick: async (rows, clearSelection) => {
          await Promise.all(
            rows.map((pm) =>
              fetch(`/api/payment-methods/${pm.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isActive: false }),
              }),
            ),
          )
          clearSelection()
          toast.success(`${rows.length} method${rows.length !== 1 ? 's' : ''} deactivated`)
          startTransition(() => router.refresh())
        },
      },
      {
        label: 'Delete',
        className: 'border-red-800 text-red-400 hover:bg-red-900/20 hover:text-red-300',
        onClick: async (rows, clearSelection) => {
          await Promise.all(
            rows.map((pm) =>
              fetch(`/api/payment-methods/${pm.id}`, {
                method: 'DELETE',
                credentials: 'include',
              }),
            ),
          )
          clearSelection()
          toast.success(`${rows.length} method${rows.length !== 1 ? 's' : ''} deleted`)
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
          <h1 className="text-xl font-semibold">Payment Methods</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {methods.length} method{methods.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Method
        </Button>
      </div>

      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            {methods.length} method{methods.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DataTable
            tableId="payment-methods"
            columns={paymentMethodColumns}
            data={methods}
            emptyMessage="No payment methods configured yet."
            bulkActions={bulkActions}
            fillParent
          />
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Type <span className="text-muted-foreground/60">(e.g. mobile-money, bank, card)</span>
              </label>
              <Input
                placeholder="mobile-money"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Country
              </label>
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
            <div className="flex items-center justify-between pt-1">
              <label className="text-sm font-medium">Active</label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
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
            <AlertDialogTitle>Delete payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.type}</strong> (
              {COUNTRIES.find((c) => c.value === deleteTarget?.country)?.label ?? deleteTarget?.country}
              ). This action cannot be undone.
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
