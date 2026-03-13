import type { Endpoint } from 'payload'
import { runRethread } from './rethread-logic'

export const rethreadEndpoint: Endpoint = {
  path: '/rethread',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updated = await runRethread(req.payload)
    return Response.json({ updated })
  },
}
