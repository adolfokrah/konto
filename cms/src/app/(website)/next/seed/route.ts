import { getPayload } from 'payload'
import { seed } from '@/endpoints/seed'
import config from '@payload-config'
import { headers } from 'next/headers'

export const maxDuration = 60 // This function can run for a maximum of 60 seconds

export async function POST(): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()

    // Authenticate by passing request headers
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return new Response('Action forbidden.', { status: 403 })
    }

    payload.logger.info('Starting seed process...')

    // Create a simplified request object for seeding
    const seedReq = {
      payload,
      user,
      locale: 'en',
      t: (key: string) => key, // Simple translation function
      where: {},
      sort: '',
      depth: 0,
    } as any

    await seed({ payload, req: seedReq })

    return Response.json({ success: true })
  } catch (e) {
    console.error('Error seeding data:', e)
    return new Response(`Error seeding data: ${e instanceof Error ? e.message : 'Unknown error'}`, {
      status: 500,
    })
  }
}
