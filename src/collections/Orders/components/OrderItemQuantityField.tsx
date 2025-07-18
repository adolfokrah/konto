'use client'

import { useEffect } from 'react'

import { TextInput, useField } from '@payloadcms/ui'

export default function OrderItemQuantityField({ path }: { path: string }) {
  const { value, setValue } = useField({ path })
  const { value: quantityReturned } = useField({
    path: path.replace('quantity', 'quantityReturned'),
  })
  const { value: originalQuantityAtPurchase } = useField({
    path: path.replace('quantity', 'originalQuantityAtPurchase'),
  })

  useEffect(() => {
    const total = Number(originalQuantityAtPurchase || 1) - (Number(quantityReturned) || 0)
    setValue(total)
  }, [quantityReturned])

  return (
    <TextInput
      label={'Quantity (Original QTY - Returned)'}
      path={path}
      value={String(value)}
      onChange={(e: any) => {
        setValue(Number(e.target.value))
      }}
      required
      readOnly={originalQuantityAtPurchase ? true : false}
    />
  )
}
