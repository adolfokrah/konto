import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PaymentMethodsDataTable } from '@/components/dashboard/payment-methods-data-table'
import { type PaymentMethodRow } from '@/components/dashboard/data-table/columns/payment-method-columns'

export default async function PaymentMethodsPage() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'payment-methods' as any,
    limit: 500,
    sort: 'country',
    overrideAccess: true,
  })

  const methods: PaymentMethodRow[] = (result.docs as any[]).map((pm) => ({
    id: pm.id,
    type: pm.type,
    country: pm.country,
    slug: pm.slug,
    isActive: pm.isActive ?? true,
  }))

  return (
    <div className="flex flex-col gap-4 h-full">
      <PaymentMethodsDataTable methods={methods} />
    </div>
  )
}
