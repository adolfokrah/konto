import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PayoutFeesDataTable } from '@/components/dashboard/payout-fees-data-table'
import { type PayoutFeeRow } from '@/components/dashboard/data-table/columns/payout-fee-columns'

export default async function PayoutFeesPage() {
  const payload = await getPayload({ config: configPromise })

  const [feesResult, methodsResult] = await Promise.all([
    payload.find({
      collection: 'payout-fees' as any,
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

  const fees: PayoutFeeRow[] = (feesResult.docs as any[]).map((doc) => {
    const pm = typeof doc.paymentMethod === 'object' && doc.paymentMethod ? doc.paymentMethod : null
    return {
      id: doc.id,
      country: doc.country,
      paymentMethod: pm ? { id: pm.id, type: pm.type } : null,
      fee: doc.fee ?? 0,
      hogapaySplit: doc.hogapaySplit ?? 0,
      flatFeeThreshold: doc.flatFeeThreshold ?? 0,
      flatFee: doc.flatFee ?? 0,
      minimumPayoutAmount: doc.minimumPayoutAmount ?? 0,
    }
  })

  const paymentMethods = (methodsResult.docs as any[]).map((pm) => ({
    id: pm.id,
    type: pm.type,
  }))

  return (
    <div className="flex flex-col gap-4 h-full">
      <PayoutFeesDataTable fees={fees} paymentMethods={paymentMethods} />
    </div>
  )
}
