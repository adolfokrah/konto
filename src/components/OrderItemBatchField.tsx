'use client'

import { fetcher } from '@/lib/utils/fetch'
import { SelectInput, useField } from '@payloadcms/ui'
import useSWR from 'swr'

export default function OrderItemUnitPriceField({ path }: { path: string }) {
  const { value, initialValue, setValue } = useField({ path })
  const product = useField({ path: path.replace('batch', 'product') })
  const type = useField({ path: path.replace('batch', 'type') })

  const { data, isLoading, error } = useSWR(`/api/products/${product?.value}`, fetcher)

  const options =
    data?.batches?.map((batch: any) => ({
      label: batch.batchNumber,
      value: String(batch.id),
    })) || []

  const selectValue = value || initialValue || ''

  if (isLoading) return <div>loading...</div>

  if (error || !data || !data?.batches?.length || type?.value == 'service') return null
  return (
    <SelectInput
      label={'Batch'}
      path={path}
      name={path}
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
