'use client'

import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import { useEffect } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

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

  return (
    <SelectInput
      label={'Batch'}
      path={path}
      name="batch"
      value={(value as string) || (initialValue as string)}
      onChange={(e) => {
        setValue(Array.isArray(e) ? e[0]?.value : String(e?.value))
      }}
      required
      options={options}
      readOnly={initialValue ? true : false}
    />
  )
}
