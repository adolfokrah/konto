import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { ContributionSettingsDataTable } from '@/components/dashboard/contribution-settings-data-table'
import { type ContributionSettingRow } from '@/components/dashboard/data-table/columns/contribution-settings-columns'

export default async function ContributionSettingsPage() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'contribution-settings' as any,
    limit: 500,
    sort: 'country',
    overrideAccess: true,
  })

  const settings: ContributionSettingRow[] = (result.docs as any[]).map((doc) => ({
    id: doc.id,
    country: doc.country,
    minimumContributionAmount: doc.minimumContributionAmount ?? 0,
    minimumPayoutAmount: doc.minimumPayoutAmount ?? 0,
    settlementDelayHours: doc.settlementDelayHours ?? 0,
  }))

  return (
    <div className="flex flex-col gap-4 h-full">
      <ContributionSettingsDataTable settings={settings} />
    </div>
  )
}
