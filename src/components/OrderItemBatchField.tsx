'use client'

import { fetcher } from '@/lib/utils/fetch'
import { RelationshipField, TextInput, useField } from '@payloadcms/ui'
import { useEffect } from 'react'
import useSWR from 'swr'

export default function OrderItemBatchField({ path, field }: { path: string; field: any }) {
  const { initialValue } = useField({ path })
  const product = useField({ path: path.replace('batch', 'product') })

  const { data, isLoading, error } = useSWR(`/api/products/${product?.value}`, fetcher)

  if (isLoading) return <div>loading...</div>

  if (data && !data?.trackExpiry) {
    return null
  }

  if (initialValue) {
    return <TextInput label={'Batch'} path={path} value={String(initialValue)} readOnly={true} />
  }

  return <RelationshipField path={path} field={field} />
}
