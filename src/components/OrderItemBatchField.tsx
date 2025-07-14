'use client'

import { fetcher } from '@/lib/utils/fetch'
import { RelationshipField, TextInput, useField } from '@payloadcms/ui'
import useSWR from 'swr'

export default function OrderItemBatchField({ path, field }: { path: string; field: any }) {
  const { value, initialValue } = useField({ path })
  const product = useField({ path: path.replace('batch', 'product') })

  const { data, isLoading, error } = useSWR(`/api/products/${product?.value}`, fetcher)

  if (isLoading) return <div>loading...</div>

  if (data && !data?.trackExpiry) {
    return null
  }

  if (initialValue && !data?.errors) {
    const name =
      data?.batches?.find((batch: any) => batch.id === initialValue)?.batchNumber || 'Unknown Batch'
    return <TextInput label={'Batch'} path={path} value={name} readOnly={true} />
  }

  return <RelationshipField path={path} field={field} />
}
