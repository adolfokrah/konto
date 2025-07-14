'use client'

import { fetcher } from '@/lib/utils/fetch'
import { TextInput, useField, useFormFields } from '@payloadcms/ui'
import { useEffect } from 'react'
import useSWR from 'swr'

export default function OrderItemUnitPriceField({ path }: { path: string }) {
  const { value, initialValue, setValue } = useField({ path })
  const product = useField({ path: path.replace('unitPrice', 'product') })
  const type = useField({ path: path.replace('unitPrice', 'type') })
  const service = useField({ path: path.replace('unitPrice', 'service') })

  const { data, isLoading, error } = useSWR(
    type?.value == 'service'
      ? `/api/services/${service?.value}`
      : `/api/products/${product?.value}`,
    fetcher,
  )

  const price = data?.sellingPricePerUnit || data?.price || '0'

  const unitPrice = String(initialValue || value)

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue)
    } else {
      setValue(price)
    }
  }, [initialValue, setValue, price])

  if (isLoading) return <div>loading...</div>
  return (
    <TextInput
      label={'Unit Price'}
      path={path}
      value={unitPrice}
      onChange={(e: any) => {
        console.log('unit price changed', e.target.value)
        setValue(e.target.value)
      }}
      required
      readOnly={true}
    />
  )
}
