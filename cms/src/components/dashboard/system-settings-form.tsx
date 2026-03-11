'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface Settings {
  collectionFee: number
  hogapayCollectionFeePercent: number
  transferFeePercentage: number
  hogapayTransferFeePercent: number
  settlementDelayHours: number
  referralFirstContributionBonus: number
  referralFeeSharePercent: number
  referralMinWithdrawalAmount: number
  referralMaxWithdrawalAmount: number
}

function NumberField({
  label,
  description,
  name,
  value,
  step,
  onChange,
}: {
  label: string
  description?: string
  name: string
  value: number
  step?: number
  onChange: (name: string, value: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type="number"
        step={step ?? 0.01}
        value={value}
        onChange={(e) => onChange(name, parseFloat(e.target.value) || 0)}
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

export function SystemSettingsForm({ settings }: { settings: Settings }) {
  const [values, setValues] = useState<Settings>({
    collectionFee: settings.collectionFee ?? 1.95,
    hogapayCollectionFeePercent: settings.hogapayCollectionFeePercent ?? 0.8,
    transferFeePercentage: settings.transferFeePercentage ?? 1,
    hogapayTransferFeePercent: settings.hogapayTransferFeePercent ?? 0.5,
    settlementDelayHours: settings.settlementDelayHours ?? 0.033,
    referralFirstContributionBonus: settings.referralFirstContributionBonus ?? 5,
    referralFeeSharePercent: settings.referralFeeSharePercent ?? 20,
    referralMinWithdrawalAmount: settings.referralMinWithdrawalAmount ?? 20,
    referralMaxWithdrawalAmount: settings.referralMaxWithdrawalAmount ?? 500,
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (name: string, value: number) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/globals/system-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.errors?.[0]?.message ?? `Save failed (${res.status})`)
      }

      toast.success('Settings saved')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Collection</CardTitle>
          <CardDescription>Fees charged on contributions</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <NumberField
            label="Fee (%)"
            description="Total fee on contributions paid by the contributor"
            name="collectionFee"
            value={values.collectionFee}
            step={0.01}
            onChange={handleChange}
          />
          <NumberField
            label="Hogapay Split (%)"
            description="Hogapay's share of the collection fee"
            name="hogapayCollectionFeePercent"
            value={values.hogapayCollectionFeePercent}
            step={0.01}
            onChange={handleChange}
          />
        </CardContent>
      </Card>

      {/* Transfer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transfer (Payout)</CardTitle>
          <CardDescription>Fees charged on withdrawals</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <NumberField
            label="Fee (%)"
            description="Total fee on payouts, deducted from payout amount"
            name="transferFeePercentage"
            value={values.transferFeePercentage}
            step={0.1}
            onChange={handleChange}
          />
          <NumberField
            label="Hogapay Split (%)"
            description="Hogapay's share of the transfer fee"
            name="hogapayTransferFeePercent"
            value={values.hogapayTransferFeePercent}
            step={0.01}
            onChange={handleChange}
          />
        </CardContent>
      </Card>

      {/* Payout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <NumberField
            label="Settlement Delay (hours)"
            description="Delay before contributions are settled (0.033 ≈ 2 min)"
            name="settlementDelayHours"
            value={values.settlementDelayHours}
            step={0.001}
            onChange={handleChange}
          />
        </CardContent>
      </Card>

      {/* Referral */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referral Bonus</CardTitle>
          <CardDescription>Rewards paid to referrers</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <NumberField
            label="First Contribution Bonus (GHS)"
            description="Flat amount paid when a referred user's jar gets its first contribution"
            name="referralFirstContributionBonus"
            value={values.referralFirstContributionBonus}
            step={0.5}
            onChange={handleChange}
          />
          <NumberField
            label="Fee Share (%)"
            description="% of Hogapay's transfer fee shared with referrer on each withdrawal"
            name="referralFeeSharePercent"
            value={values.referralFeeSharePercent}
            step={1}
            onChange={handleChange}
          />
          <NumberField
            label="Min Withdrawal (GHS)"
            description="Minimum referral balance to initiate a withdrawal"
            name="referralMinWithdrawalAmount"
            value={values.referralMinWithdrawalAmount}
            step={1}
            onChange={handleChange}
          />
          <NumberField
            label="Max Withdrawal (GHS)"
            description="Maximum referral amount withdrawable at once (0 = no limit)"
            name="referralMaxWithdrawalAmount"
            value={values.referralMaxWithdrawalAmount}
            step={10}
            onChange={handleChange}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
