import type { PayloadRequest } from 'payload'

// Helper to parse list-type query params that may be comma-separated
export const parseList = (value: any): string[] | undefined => {
  if (!value) return undefined
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return undefined
}

// Build Payload `where` clause based on filters and user access (creator vs collector)
export const buildWhere = async (req: PayloadRequest) => {
  const { jarId, paymentMethods, statuses, collectors, startDate, endDate, contributor } =
    req.query as Record<string, string>

  let jar: any = null
  if (jarId) {
    try {
      jar = await req.payload.findByID({ collection: 'jars', id: jarId, depth: 0 })
    } catch (_) {
      /* ignore */
    }
  }

  if (!jar) {
    return { error: 'Jar not found', where: null, jar: null }
  }

  const isAdminRole = (req.user as any)?.role === 'admin'

  const creatorId =
    typeof jar?.creator === 'object' ? String(jar.creator?.id ?? '') : String(jar?.creator ?? '')
  const isJarCreator = !!req.user?.id && creatorId === String(req.user.id)

  // Check if user is an accepted admin collector on this jar
  const isAdminCollector =
    Array.isArray(jar?.invitedCollectors) &&
    jar.invitedCollectors.some((ic: any) => {
      const collectorId = typeof ic.collector === 'object' ? ic.collector?.id : ic.collector
      return collectorId === req.user?.id && ic.role === 'admin' && ic.status === 'accepted'
    })

  const hasFullAccess = isAdminRole || isJarCreator || isAdminCollector

  const where: any = {
    jar: { equals: jar.id },
  }

  // Restrict non-creators and non-admin collectors to their own collected contributions
  if (!hasFullAccess) {
    where.collector = { equals: req.user!.id }
  }

  if (contributor) {
    // Loose match on contributor or phone number
    where.or = [
      { contributor: { like: contributor } },
      { contributorPhoneNumber: { like: contributor } },
    ]
  }

  const paymentList = parseList(paymentMethods)
  if (paymentList?.length) {
    where.paymentMethod = { in: paymentList }
  }

  const statusList = parseList(statuses)
  if (statusList?.length) {
    where.paymentStatus = { in: statusList }
  }

  // Collector filtering:
  // - If user is NOT the jar creator, force collector = current user (ignore any supplied collectors filter for security)
  // - If user IS the jar creator, allow optional collectors filter list
  const collectorList = parseList(collectors)
  if (hasFullAccess) {
    if (collectorList?.length) {
      where.collector = { in: collectorList }
    }
  } else {
    // Already constrained earlier to the requesting user's ID; ignore incoming collectorList
    // Ensure it remains enforced (in case future refactors move code)
    where.collector = { equals: req.user!.id }
  }

  if (startDate) {
    const sd = new Date(startDate as string)
    if (!isNaN(sd.getTime())) {
      where.createdAt = where.createdAt || {}
      where.createdAt.greater_than_equal = sd.toISOString()
    }
  }
  if (endDate) {
    const ed = new Date(endDate as string)
    if (!isNaN(ed.getTime())) {
      where.createdAt = where.createdAt || {}
      where.createdAt.less_than_equal = ed.toISOString()
    }
  }

  return { where, jar }
}
