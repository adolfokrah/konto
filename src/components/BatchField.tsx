'use client'

import { fetcher } from '@/lib/utils/fetch'
import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import { useEffect } from 'react'
import useSWR from 'swr'

export default function BatchField({ path }: { path: string }) {
  const { value, initialValue, setValue } = useField({ path })
  const product = useFormFields(([fields]) => fields?.product.value)

  const { data, isLoading, error } = useSWR(`/api/products/${product}`, fetcher)

  const options =
    data?.batches?.map((batch: any) => ({
      label: batch.batchNumber,
      value: String(batch.id),
    })) || []

  useEffect(() => {
    setValue(null)
  }, [product])

  if (isLoading) return <div>loading....</div>

  if (error) return <div>Error loading batches: {error.message}</div>

  if (!options.length) return null

  const selectValue = value || initialValue || ''

  return (
    <SelectInput
      label={'Batch'}
      path={path}
      name="batch"
      value={String(selectValue)}
      onChange={(e) => {
        setValue(Array.isArray(e) ? e[0]?.value : String(e?.value))
      }}
      required
      options={options}
      readOnly={initialValue ? true : false}
    />
  )
}
