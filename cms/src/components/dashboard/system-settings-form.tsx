'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={name}
        type="number"
        step={step ?? 0.01}
        value={value}
        onChange={(e) => onChange(name, parseFloat(e.target.value) || 0)}
        className="h-9"
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

function SectionSummary({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1">
      {items.map((item) => (
        <span key={item.label} className="text-xs text-muted-foreground">
          {item.label}:{' '}
          <span className="font-semibold text-foreground">{item.value}</span>
        </span>
      ))}
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

  const settlementLabel =
    values.settlementDelayHours < 1
      ? `${Math.round(values.settlementDelayHours * 60)} min`
      : `${values.settlementDelayHours}h`

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Accordion type="multiple" defaultValue={['collection', 'transfer', 'payout', 'referral']} className="space-y-3">
        {/* Collection */}
        <AccordionItem
          value="collection"
          className="rounded-xl border bg-card px-5 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Percent className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-none">Collection</p>
                <SectionSummary
                  items={[
                    { label: 'Fee', value: `${values.collectionFee}%` },
                    { label: 'Hogapay split', value: `${values.hogapayCollectionFeePercent}%` },
                  ]}
                />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-5">
            <p className="mb-4 text-xs text-muted-foreground">Fees charged on contributions</p>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Fee (%)"
                description="Total fee paid by the contributor"
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Transfer */}
        <AccordionItem
          value="transfer"
          className="rounded-xl border bg-card px-5 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-none">Transfer (Payout)</p>
                <SectionSummary
                  items={[
                    { label: 'Fee', value: `${values.transferFeePercentage}%` },
                    { label: 'Hogapay split', value: `${values.hogapayTransferFeePercent}%` },
                  ]}
                />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-5">
            <p className="mb-4 text-xs text-muted-foreground">Fees charged on withdrawals</p>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Fee (%)"
                description="Deducted from payout amount"
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Payout Settings */}
        <AccordionItem
          value="payout"
          className="rounded-xl border bg-card px-5 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-none">Payout Settings</p>
                <SectionSummary
                  items={[{ label: 'Settlement delay', value: settlementLabel }]}
                />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-5">
            <p className="mb-4 text-xs text-muted-foreground">Timing for contribution settlement</p>
            <div className="max-w-xs">
              <NumberField
                label="Settlement Delay (hours)"
                description="0.033 ≈ 2 min"
                name="settlementDelayHours"
                value={values.settlementDelayHours}
                step={0.001}
                onChange={handleChange}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Referral Bonus */}
        <AccordionItem
          value="referral"
          className="rounded-xl border bg-card px-5 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-none">Referral Bonus</p>
                <SectionSummary
                  items={[
                    { label: 'Bonus', value: `GHS ${values.referralFirstContributionBonus}` },
                    { label: 'Fee share', value: `${values.referralFeeSharePercent}%` },
                    { label: 'Min withdrawal', value: `GHS ${values.referralMinWithdrawalAmount}` },
                    {
                      label: 'Max withdrawal',
                      value:
                        values.referralMaxWithdrawalAmount === 0
                          ? 'No limit'
                          : `GHS ${values.referralMaxWithdrawalAmount}`,
                    },
                  ]}
                />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-5">
            <p className="mb-4 text-xs text-muted-foreground">Rewards paid to referrers</p>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="First Contribution Bonus (GHS)"
                description="Paid when referred user's jar gets its first contribution"
                name="referralFirstContributionBonus"
                value={values.referralFirstContributionBonus}
                step={0.5}
                onChange={handleChange}
              />
              <NumberField
                label="Fee Share (%)"
                description="% of Hogapay's transfer fee shared with referrer"
                name="referralFeeSharePercent"
                value={values.referralFeeSharePercent}
                step={1}
                onChange={handleChange}
              />
              <NumberField
                label="Min Withdrawal (GHS)"
                description="Minimum balance to initiate a withdrawal"
                name="referralMinWithdrawalAmount"
                value={values.referralMinWithdrawalAmount}
                step={1}
                onChange={handleChange}
              />
              <NumberField
                label="Max Withdrawal (GHS)"
                description="Max per withdrawal (0 = no limit)"
                name="referralMaxWithdrawalAmount"
                value={values.referralMaxWithdrawalAmount}
                step={10}
                onChange={handleChange}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
