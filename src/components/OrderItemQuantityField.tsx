'use client'

import { TextInput, useField, useFormFields } from '@payloadcms/ui'

export default function OrderItemUnitPriceField({ path }: { path: string }) {
  const { value, initialValue, setValue } = useField({ path })

  const quantity = String(initialValue || value || '1')
  return (
    <TextInput
      label={'Quantity'}
      path={path}
      value={quantity}
      onChange={(e: any) => {
        setValue(Number(e.target.value))
      }}
      required
      readOnly={initialValue ? true : false}
    />
  )
}
