import Link from 'next/link'
import { Payload } from 'payload'

export default async function BatchCell({ cellData, field }: { cellData?: number; field: any }) {
  if (!cellData) {
    return null
  }

  return <div style={{ color: cellData < 0 ? 'red' : 'green' }}>{cellData}</div>
}
