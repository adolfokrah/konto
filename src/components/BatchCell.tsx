import Link from 'next/link'
import { Payload } from 'payload'

export default async function BatchCell({
  cellData,
  payload,
}: {
  cellData?: string
  payload: Payload
}) {
  if (!cellData) {
    return null
  }

  const data = await payload.findByID({
    collection: 'batches',
    id: cellData,
  })

  return <Link href={`batches/${cellData}`}>{data?.batchNumber}</Link>
}
