'use client'

import { SelectInput, useField } from '@payloadcms/ui'

export default function OrderItemProductField({ path }: { path: string; field: any }) {
  const { value, setValue, initialValue } = useField({ path })
  return (
    <SelectInput
      label="Type"
      path={path}
      name={path}
      options={[
        { label: 'Product', value: 'product' },
        { label: 'Service', value: 'service' },
      ]}
      value={String(initialValue || value || '')}
      onChange={e => {
        setValue(Array.isArray(e) ? e[0]?.value : String(e?.value))
      }}
      readOnly={Boolean(initialValue)}
    />
  )
}
