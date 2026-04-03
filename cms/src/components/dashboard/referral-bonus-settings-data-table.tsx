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
import {
  referralBonusSettingsColumns,
  type ReferralBonusSettingRow,
} from './data-table/columns/referral-bonus-settings-columns'
import { type BulkAction } from './data-table/types'

const COUNTRIES = [
  { label: 'Ghana', value: 'ghana' },
  { label: 'Nigeria', value: 'nigeria' },
]

type FormState = {
  country: string
  firstContributionBonus: string
  feeShare: string
  minWithdrawal: string
}

const empty: FormState = { country: 'ghana', firstContributionBonus: '', feeShare: '', minWithdrawal: '' }

export function ReferralBonusSettingsDataTable({ settings }: { settings: ReferralBonusSettingRow[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ReferralBonusSettingRow | null>(null)
  const [editing, setEditing] = useState<ReferralBonusSettingRow | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)

  const openAdd = () => {
    setEditing(null)
    setForm(empty)
    setDialogOpen(true)
  }

  const openEdit = (row: ReferralBonusSettingRow) => {
    setEditing(row)
    setForm({
      country: row.country,
      firstContributionBonus: String(row.firstContributionBonus),
      feeShare: String(row.feeShare),
      minWithdrawal: String(row.minWithdrawal),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.country || form.firstContributionBonus === '' || form.feeShare === '' || form.minWithdrawal === '') {
      toast.error('All fields are required')
      return
    }
    setSaving(true)
    try {
      const body = {
        country: form.country,
        firstContributionBonus: parseFloat(form.firstContributionBonus),
        feeShare: parseFloat(form.feeShare),
        minWithdrawal: parseFloat(form.minWithdrawal),
      }
      const res = editing
        ? await fetch(`/api/referral-bonus-settings/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
          })
        : await fetch('/api/referral-bonus-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
          })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.errors?.[0]?.message ?? `Failed (${res.status})`)
      }
      toast.success(editing ? 'Settings updated' : 'Settings added')
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
      const res = await fetch(`/api/referral-bonus-settings/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      toast.success('Settings deleted')
      setDeleteTarget(null)
      startTransition(() => router.refresh())
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const tableMeta = useMemo(() => ({ onEdit: openEdit, onDelete: setDeleteTarget }), [])

  const bulkActions: BulkAction<ReferralBonusSettingRow>[] = useMemo(
    () => [
      {
        label: 'Delete',
        className: 'border-red-800 text-red-400 hover:bg-red-900/20 hover:text-red-300',
        onClick: async (rows, clearSelection) => {
          await Promise.all(
            rows.map((r) =>
              fetch(`/api/referral-bonus-settings/${r.id}`, {
                method: 'DELETE',
                credentials: 'include',
              }),
            ),
          )
          clearSelection()
          toast.success(`${rows.length} record${rows.length !== 1 ? 's' : ''} deleted`)
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
          <h1 className="text-xl font-semibold">Referral Bonus</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {settings.length} record{settings.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader>
          <CardTitle>Referral Bonus</CardTitle>
          <CardDescription>
            {settings.length} record{settings.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <DataTable
            tableId="referral-bonus-settings"
            columns={referralBonusSettingsColumns}
            data={settings}
            emptyMessage="No referral bonus settings configured yet."
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
            <DialogTitle>{editing ? 'Edit Referral Bonus' : 'Add Referral Bonus'}</DialogTitle>
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
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">First Contribution Bonus</label>
              <Input
                type="number"
                step="0.5"
                placeholder="5"
                value={form.firstContributionBonus}
                onChange={(e) => setForm((p) => ({ ...p, firstContributionBonus: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fee Share (%)</label>
                <Input
                  type="number"
                  step="1"
                  placeholder="20"
                  value={form.feeShare}
                  onChange={(e) => setForm((p) => ({ ...p, feeShare: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Min Withdrawal</label>
                <Input
                  type="number"
                  step="1"
                  placeholder="20"
                  value={form.minWithdrawal}
                  onChange={(e) => setForm((p) => ({ ...p, minWithdrawal: e.target.value }))}
                />
              </div>
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
            <AlertDialogTitle>Delete referral bonus settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the referral bonus settings for{' '}
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
