'use client'

import { fetcher } from '@/lib/utils/fetch'
import { RelationshipField, TextInput, useField } from '@payloadcms/ui'
import useSWR from 'swr'

export default function OrderItemBatchField({ path, field }: { path: string; field: any }) {
  const product = useField({ path: path.replace('batch', 'product') })
  const { value: batchMetadataAtPurchase } = useField({
    path: path.replace('batch', 'batchMetadataAtPurchase'),
  })

  const { data, isLoading } = useSWR(`/api/products/${product?.value}`, fetcher)

  if (isLoading) return <div>loading...</div>

  if (data && !data?.trackExpiry) {
    return null
  }

  if (batchMetadataAtPurchase) {
    return (
      <TextInput
        label={'Batch Number'}
        path={path}
        value={(batchMetadataAtPurchase as any).batchNumber}
        readOnly={true}
      />
    )
  }

  return <RelationshipField path={path} field={field} />
}
