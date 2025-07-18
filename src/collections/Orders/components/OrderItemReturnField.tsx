'use client'

import { TextInput, useField } from '@payloadcms/ui'

export default function OrderItemReturnField({ path }: { path: string }) {
  const { value, initialValue, setValue } = useField({ path })
  const { value: originalQuantityAtPurchase } = useField({
    path: path.replace('quantityReturned', 'originalQuantityAtPurchase'),
  })

  return (
    <TextInput
      label={'Quantity Returned'}
      path={path}
      value={String(value)}
      onChange={(e: any) => {
        setValue(e.target.value)
      }}
      required
      readOnly={
        originalQuantityAtPurchase
          ? originalQuantityAtPurchase == (initialValue || 0)
            ? true
            : false
          : true
      } // Allow editing only if there is no initial value
    />
  )
}
