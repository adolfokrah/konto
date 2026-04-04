import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { RefundFeesDataTable } from '@/components/dashboard/refund-fees-data-table'
import { type RefundFeeRow } from '@/components/dashboard/data-table/columns/refund-fee-columns'

export default async function RefundFeesPage() {
  const payload = await getPayload({ config: configPromise })

  const feesResult = await payload.find({
    collection: 'refund-fees' as any,
    limit: 500,
    sort: 'country',
    overrideAccess: true,
  })

  const fees: RefundFeeRow[] = (feesResult.docs as any[]).map((doc) => ({
    id: doc.id,
    country: doc.country,
    fee: doc.fee ?? 0,
  }))

  return (
    <div className="flex flex-col gap-4 h-full">
      <RefundFeesDataTable fees={fees} />
    </div>
  )
}
