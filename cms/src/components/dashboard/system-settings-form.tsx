'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Smartphone,
  CreditCard,
  Landmark,
  Clock,
  Gift,
  Wallet,
  Receipt,
} from 'lucide-react'
import { useIsAdmin } from './dashboard-user-context'

interface Settings {
  collectionFee: number
  hogapayCollectionFeePercent: number
  cardCollectionFee: number
  hogapayCardCollectionFeePercent: number
  transferFeePercentage: number
  hogapayTransferFeePercent: number
  bankTransferFeePercentage: number
  hogapayBankTransferFeePercent: number
  settlementDelayHours: number
  referralFirstContributionBonus: number
  referralFeeSharePercent: number
  referralMinWithdrawalAmount: number
  referralMaxWithdrawalAmount: number
}

const DEFAULTS: Settings = {
  collectionFee: 1.95,
  hogapayCollectionFeePercent: 0.8,
  cardCollectionFee: 3,
  hogapayCardCollectionFeePercent: 0.5,
  transferFeePercentage: 1,
  hogapayTransferFeePercent: 0.5,
  bankTransferFeePercentage: 1,
  hogapayBankTransferFeePercent: 0.5,
  settlementDelayHours: 0.033,
  referralFirstContributionBonus: 5,
  referralFeeSharePercent: 20,
  referralMinWithdrawalAmount: 20,
  referralMaxWithdrawalAmount: 500,
}

type StringSettings = Record<keyof Settings, string>
type TabKey = 'fees' | 'payouts' | 'referrals'

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'fees', label: 'Collection fees', icon: Receipt },
  { key: 'payouts', label: 'Payouts', icon: Wallet },
  { key: 'referrals', label: 'Referrals', icon: Gift },
]

/** A titled sub-group with an icon and a responsive grid of fields. */
function Group({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted/30">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2">{children}</div>
    </div>
  )
}

export function SystemSettingsForm({ settings }: { settings: Settings }) {
  const isAdmin = useIsAdmin()
  const [tab, setTab] = useState<TabKey>('fees')
  // Keep raw string values so partial entries like "0." and "0.5" are typable.
  const [values, setValues] = useState<StringSettings>(() => {
    const initial = {} as StringSettings
    for (const key of Object.keys(DEFAULTS) as (keyof Settings)[]) {
      initial[key] = String(settings[key] ?? DEFAULTS[key])
    }
    return initial
  })
  const [saving, setSaving] = useState(false)

  const set = (name: keyof Settings, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {} as Record<keyof Settings, number>
      for (const key of Object.keys(DEFAULTS) as (keyof Settings)[]) {
        payload[key] = parseFloat(values[key]) || 0
      }
      const res = await fetch('/api/globals/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
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

  /** Stacked field: label, input, helper text. Rendered via a function call
   *  (not a nested component) so inputs keep focus across re-renders. */
  const field = ({
    name,
    label,
    hint,
    suffix,
    step = 0.01,
  }: {
    name: keyof Settings
    label: string
    hint?: string
    suffix?: string
    step?: number
  }) => (
    <div key={name} className="min-w-0">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative mt-1.5">
        <Input
          type="text"
          inputMode="decimal"
          step={step}
          value={values[name]}
          onChange={(e) => {
            const v = e.target.value
            if (v === '' || /^\d*\.?\d*$/.test(v)) set(name, v)
          }}
          className="h-10 pr-10 tabular-nums"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  )

  const settlementHours = parseFloat(values.settlementDelayHours) || 0
  const settlementLabel =
    settlementHours < 1 ? `${Math.round(settlementHours * 60)} min` : `${settlementHours}h`

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="inline-flex flex-wrap gap-1 rounded-xl border bg-muted/40 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Collection fees */}
      {tab === 'fees' && (
        <div className="space-y-5">
          <Group
            icon={Smartphone}
            title="Mobile money"
            description="Fees on mobile money contributions"
          >
            {field({ name: 'collectionFee', label: 'Fee', suffix: '%', hint: 'Total fee paid by the contributor' })}
            {field({
              name: 'hogapayCollectionFeePercent',
              label: 'Hogapay split',
              suffix: '%',
              hint: "Hogapay's share of the fee",
            })}
          </Group>

          <Group icon={CreditCard} title="Card" description="Fees on card contributions">
            {field({ name: 'cardCollectionFee', label: 'Fee', suffix: '%', hint: 'Total fee paid by the contributor' })}
            {field({
              name: 'hogapayCardCollectionFeePercent',
              label: 'Hogapay split',
              suffix: '%',
              hint: "Hogapay's share of the fee",
            })}
          </Group>
        </div>
      )}

      {/* Payouts */}
      {tab === 'payouts' && (
        <div className="space-y-5">
          <Group
            icon={Smartphone}
            title="Mobile money payout"
            description="Fee deducted from mobile money withdrawals"
          >
            {field({ name: 'transferFeePercentage', label: 'Fee', suffix: '%', step: 0.1, hint: 'Deducted from the payout' })}
            {field({
              name: 'hogapayTransferFeePercent',
              label: 'Hogapay split',
              suffix: '%',
              hint: "Hogapay's share of the fee",
            })}
          </Group>

          <Group
            icon={Landmark}
            title="Bank payout"
            description="Fee deducted from bank withdrawals"
          >
            {field({ name: 'bankTransferFeePercentage', label: 'Fee', suffix: '%', step: 0.1, hint: 'Deducted from the payout' })}
            {field({
              name: 'hogapayBankTransferFeePercent',
              label: 'Hogapay split',
              suffix: '%',
              hint: "Hogapay's share of the fee",
            })}
          </Group>

          <Group icon={Clock} title="Settlement" description="When contributions become available">
            {field({
              name: 'settlementDelayHours',
              label: 'Settlement delay',
              suffix: 'hrs',
              step: 0.001,
              hint: `Currently ${settlementLabel} · 0.033 ≈ 2 min`,
            })}
          </Group>
        </div>
      )}

      {/* Referrals */}
      {tab === 'referrals' && (
        <Group icon={Gift} title="Referral bonus" description="Rewards paid to referrers">
          {field({
            name: 'referralFirstContributionBonus',
            label: 'First contribution bonus',
            suffix: 'GHS',
            step: 0.5,
            hint: "Paid on the referred jar's first contribution",
          })}
          {field({
            name: 'referralFeeSharePercent',
            label: 'Fee share',
            suffix: '%',
            step: 1,
            hint: "Share of Hogapay's transfer fee given to the referrer",
          })}
          {field({
            name: 'referralMinWithdrawalAmount',
            label: 'Min withdrawal',
            suffix: 'GHS',
            step: 1,
            hint: 'Minimum balance to withdraw',
          })}
          {field({
            name: 'referralMaxWithdrawalAmount',
            label: 'Max withdrawal',
            suffix: 'GHS',
            step: 10,
            hint: 'Max per withdrawal (0 = no limit)',
          })}
        </Group>
      )}

      {isAdmin && (
        <div className="sticky bottom-0 flex justify-end border-t bg-background/80 py-3 backdrop-blur">
          <Button onClick={handleSave} disabled={saving} className="min-w-32">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save settings'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
