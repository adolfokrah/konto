import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { CollectionFeesDataTable } from '@/components/dashboard/collection-fees-data-table'
import { type CollectionFeeRow } from '@/components/dashboard/data-table/columns/collection-fee-columns'

export default async function CollectionFeesPage() {
  const payload = await getPayload({ config: configPromise })

  const [feesResult, methodsResult] = await Promise.all([
    payload.find({
      collection: 'collection-fees' as any,
      limit: 500,
      sort: 'country',
      depth: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'payment-methods' as any,
      limit: 500,
      sort: 'type',
      overrideAccess: true,
    }),
  ])

  const fees: CollectionFeeRow[] = (feesResult.docs as any[]).map((doc) => {
    const pm = typeof doc.paymentMethod === 'object' && doc.paymentMethod ? doc.paymentMethod : null
    return {
      id: doc.id,
      country: doc.country,
      paymentMethod: pm ? { id: pm.id, type: pm.type, slug: pm.slug } : null,
      fee: doc.fee ?? 0,
      hogapaySplit: doc.hogapaySplit ?? 0,
      minimumContributionAmount: doc.minimumContributionAmount ?? 0,
    }
  })

  const paymentMethods = (methodsResult.docs as any[]).map((pm) => ({
    id: pm.id,
    type: pm.type,
  }))

  return (
    <div className="flex flex-col gap-4 h-full">
      <CollectionFeesDataTable fees={fees} paymentMethods={paymentMethods} />
    </div>
  )
}
