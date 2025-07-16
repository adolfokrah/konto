'use client'
import { RelationshipField, useField } from '@payloadcms/ui'
export default function OrderItemShopField({ path, field }: { path: string; field: any }) {
  const { initialValue } = useField({
    path: 'shop',
  })

  return <RelationshipField path={path} field={field} readOnly={Boolean(initialValue)} />
}
