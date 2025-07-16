'use client'

import { RelationshipField, TextInput, useField } from '@payloadcms/ui'

export default function OrderItemProductField({ path, field }: { path: string; field: any }) {
  const { value: productMetadataAtPurchase } = useField({
    path: path.replace('product', 'productMetadataAtPurchase'),
  })

  if (productMetadataAtPurchase) {
    return (
      <TextInput
        label={'Item'}
        path={path}
        value={(productMetadataAtPurchase as any)?.name}
        readOnly={true}
      />
    )
  }

  return <RelationshipField path={path} field={field} />
}
