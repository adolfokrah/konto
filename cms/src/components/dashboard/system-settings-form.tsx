'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Percent, Clock, Gift, ArrowRightLeft } from 'lucide-react'

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

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-border/50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0 w-36">{children}</div>
    </div>
  )
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="px-5">{children}</div>
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

  const set = (name: keyof Settings, value: number) =>
    setValues((prev) => ({ ...prev, [name]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/globals/system-settings', {
        method: 'POST',
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

  const numInput = (name: keyof Settings, step = 0.01) => (
    <Input
      type="number"
      step={step}
      value={values[name]}
      onChange={(e) => set(name, parseFloat(e.target.value) || 0)}
      className="h-9 text-right"
    />
  )

  const settlementLabel =
    values.settlementDelayHours < 1
      ? `${Math.round(values.settlementDelayHours * 60)} min`
      : `${values.settlementDelayHours}h`

  return (
    <div className="space-y-4">
      <SettingsCard icon={Percent} title="Collection" description="Fees charged on contributions">
        <SettingRow label="Fee (%)" description="Total fee paid by the contributor">
          {numInput('collectionFee', 0.01)}
        </SettingRow>
        <SettingRow label="Hogapay Split (%)" description="Hogapay's share of the collection fee">
          {numInput('hogapayCollectionFeePercent', 0.01)}
        </SettingRow>
      </SettingsCard>

      <SettingsCard icon={ArrowRightLeft} title="Transfer (Payout)" description="Fees charged on withdrawals">
        <SettingRow label="Fee (%)" description="Deducted from payout amount">
          {numInput('transferFeePercentage', 0.1)}
        </SettingRow>
        <SettingRow label="Hogapay Split (%)" description="Hogapay's share of the transfer fee">
          {numInput('hogapayTransferFeePercent', 0.01)}
        </SettingRow>
      </SettingsCard>

      <SettingsCard icon={Clock} title="Payout Settings" description="Timing for contribution settlement">
        <SettingRow
          label="Settlement Delay (hours)"
          description={`Current: ${settlementLabel} — 0.033 ≈ 2 min`}
        >
          {numInput('settlementDelayHours', 0.001)}
        </SettingRow>
      </SettingsCard>

      <SettingsCard icon={Gift} title="Referral Bonus" description="Rewards paid to referrers">
        <SettingRow
          label="First Contribution Bonus (GHS)"
          description="Paid when referred user's jar gets its first contribution"
        >
          {numInput('referralFirstContributionBonus', 0.5)}
        </SettingRow>
        <SettingRow label="Fee Share (%)" description="% of Hogapay's transfer fee shared with referrer">
          {numInput('referralFeeSharePercent', 1)}
        </SettingRow>
        <SettingRow label="Min Withdrawal (GHS)" description="Minimum balance to initiate a withdrawal">
          {numInput('referralMinWithdrawalAmount', 1)}
        </SettingRow>
        <SettingRow label="Max Withdrawal (GHS)" description="Max per withdrawal (0 = no limit)">
          {numInput('referralMaxWithdrawalAmount', 10)}
        </SettingRow>
      </SettingsCard>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="min-w-28">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  )
}
