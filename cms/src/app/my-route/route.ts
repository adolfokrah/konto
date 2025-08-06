import { getPayloadHMR } from '@payloadcms/next/utilities'
import type { NextRequest } from 'next/server'

import configPromise from '@payload-config'

export async function GET(_request: NextRequest) {
  const _payload = await getPayloadHMR({ config: configPromise })

  return Response.json({
    message: 'This is an example of a custom route.',
  })
}
