'use client'
import { RelationshipField, TextInput, useField } from '@payloadcms/ui'
export default function OrderItemProductField({ path, field }: { path: string; field: any }) {
  const { value: customerMetadataAtPurchase } = useField({
    path: 'customerMetadataAtPurchase',
  })

  if (customerMetadataAtPurchase) {
    return (
      <TextInput
        label={'Item'}
        path={path}
        value={(customerMetadataAtPurchase as any)?.name}
        readOnly={true}
      />
    )
  }

  return <RelationshipField path={path} field={field} />
}
