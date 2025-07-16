'use client'

import { RelationshipField, TextInput, useField } from '@payloadcms/ui'

export default function OrderItemServiceField({ path, field }: { path: string; field: any }) {
  const { value: serviceMetadataAtPurchase } = useField({
    path: path.replace('service', 'serviceMetadataAtPurchase'),
  })

  if (serviceMetadataAtPurchase) {
    return (
      <TextInput
        label={'Item'}
        path={path}
        value={(serviceMetadataAtPurchase as any).name}
        readOnly={true}
      />
    )
  }

  return <RelationshipField path={path} field={field} />
}
