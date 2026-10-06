import { CollectionBeforeValidateHook, APIError } from 'payload'

export const validateJarCreatorAccount: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  // Only validate for create operations
  if (operation !== 'create') {
    return
  }

  // Check if jar is provided
  if (!data?.jar) {
    return
  }

  try {
    // Get the jar with creator information
    const jar = await req.payload.findByID({
      collection: 'jars',
      id: typeof data.jar === 'string' ? data.jar : data.jar.id,
      depth: 2, // Get creator details
    })

    if (!jar || !jar.creator) {
      throw new APIError('Jar creator not found', 404)
    }

    // Block all transactions on frozen jars
    if (jar.status === 'frozen') {
      throw new APIError('This jar is currently frozen and cannot accept transactions', 403)
    }

    if (jar.status === 'sealed') {
      throw new APIError('This jar is currently sealed and cannot accept transactions', 403)
    }

    if (jar.status === 'broken') {
      throw new APIError('This jar is currently broken and cannot accept transactions', 403)
    }

    // Requests made as an app user (REST): only contributions, and only to a jar the user
    // creates or collects for. Server code (local API, no user) and admins aren't
    // restricted here.
    const user = req.user as { id: string; role?: string } | null | undefined
    if (user && user.role !== 'admin') {
      if (data.type && data.type !== 'contribution') {
        throw new APIError('Only contributions can be recorded here', 403)
      }

      const creatorId = typeof jar.creator === 'object' ? jar.creator.id : jar.creator
      const isCollector = (jar.invitedCollectors ?? []).some((ic: any) => {
        const id = typeof ic.collector === 'object' ? ic.collector?.id : ic.collector
        return id === user.id && ic.status === 'accepted'
      })
      if (creatorId !== user.id && !isCollector) {
        throw new APIError('Only the jar creator or its collectors can record contributions', 403)
      }
    }
  } catch (error) {
    // If it's our custom APIError, throw it as is
    if (error instanceof APIError) {
      throw error
    }

    // For other errors, log and throw generic message
    console.error('Error validating jar creator account:', error)
    throw new APIError("Mobile money contribution can't be made at this time", 400)
  }
}
