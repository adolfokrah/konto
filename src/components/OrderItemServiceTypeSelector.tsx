'use client'

import { SelectInput, useField } from '@payloadcms/ui'

export default function OrderItemProductField({ path }: { path: string; field: any }) {
  const { value, setValue } = useField({ path })

  return (
    <SelectInput
      path={path}
      name={path}
      options={[
        { label: 'Product', value: 'product' },
        { label: 'Service', value: 'service' },
      ]}
      value={String(value)}
      onChange={(e) => {
        setValue(Array.isArray(e) ? e[0]?.value : String(e?.value))
      }}
    />
  )
}
