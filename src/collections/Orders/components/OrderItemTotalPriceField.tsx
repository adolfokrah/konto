'use client'

import { TextInput, useField } from '@payloadcms/ui'

export default function OrderItemTotalPriceField({ path }: { path: string }) {
  const { value, initialValue, setValue } = useField({ path })
  const unitPrice = useField({ path: path.replace('totalPrice', 'unitPrice') })
  const quantity = useField({ path: path.replace('totalPrice', 'quantity') })

  const price = unitPrice?.value || '0'

  const totalPrice = Number(initialValue || value || price) * Number(quantity?.value || 1)

  return (
    <TextInput
      label={'Total Price'}
      path={path}
      value={String(totalPrice)}
      onChange={(e: any) => {
        setValue(e.target.value)
      }}
      required
      readOnly={true}
    />
  )
}
