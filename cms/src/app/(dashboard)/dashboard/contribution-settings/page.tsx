import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { SettlementDelaysDataTable } from '@/components/dashboard/contribution-settings-data-table'
import { type SettlementDelayRow } from '@/components/dashboard/data-table/columns/contribution-settings-columns'

export default async function ContributionSettingsPage() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'contribution-settings' as any,
    limit: 500,
    sort: 'country',
    overrideAccess: true,
  })

  const settings: SettlementDelayRow[] = (result.docs as any[]).map((doc) => ({
    id: doc.id,
    country: doc.country,
    hours: doc.hours ?? 0,
  }))

  return (
    <div className="flex flex-col gap-4 h-full">
      <SettlementDelaysDataTable settings={settings} />
    </div>
  )
}
