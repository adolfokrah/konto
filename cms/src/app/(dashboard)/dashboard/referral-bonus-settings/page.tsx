import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { ReferralBonusSettingsDataTable } from '@/components/dashboard/referral-bonus-settings-data-table'
import { type ReferralBonusSettingRow } from '@/components/dashboard/data-table/columns/referral-bonus-settings-columns'

export default async function ReferralBonusSettingsPage() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'referral-bonus-settings' as any,
    limit: 500,
    sort: 'country',
    overrideAccess: true,
  })

  const settings: ReferralBonusSettingRow[] = (result.docs as any[]).map((doc) => ({
    id: doc.id,
    country: doc.country,
    firstContributionBonus: doc.firstContributionBonus ?? 0,
    feeShare: doc.feeShare ?? 0,
    minWithdrawal: doc.minWithdrawal ?? 0,
  }))

  return (
    <div className="flex flex-col gap-4 h-full">
      <ReferralBonusSettingsDataTable settings={settings} />
    </div>
  )
}
