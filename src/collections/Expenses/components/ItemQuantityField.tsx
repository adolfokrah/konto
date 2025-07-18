'use client'

import { TextInput, useField } from '@payloadcms/ui'

export default function ItemQuantityField({ path }: { path: string }) {
  const { value, initialValue, setValue } = useField({ path })

  const quantity = String(initialValue || value || '')
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
