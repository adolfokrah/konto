'use client'

import { fetcher } from '@/lib/utils/fetch'
import { RelationshipField, TextInput, useField } from '@payloadcms/ui'
import useSWR from 'swr'

export default function OrderItemServiceField({ path, field }: { path: string; field: any }) {
  const { value, initialValue } = useField({ path })

  const { data, isLoading, error } = useSWR(`/api/services/${initialValue}`, fetcher)

  if (isLoading) return <div>loading...</div>

  if (initialValue && !data?.errors) {
    return <TextInput label={'Service'} path={path} value={data?.name} readOnly={true} />
  }

  return <RelationshipField path={path} field={field} />
}
