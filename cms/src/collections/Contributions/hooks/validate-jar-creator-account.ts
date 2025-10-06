import { CollectionBeforeValidateHook, APIError } from 'payload'

export const validateJarCreatorAccount: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  // Only validate for create operations and mobile-money payments
  if (operation !== 'create' || data?.paymentMethod !== 'mobile-money') {
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

    // Check if creator has withdrawal account number
    const creator =
      typeof jar.creator === 'string'
        ? await req.payload.findByID({
            collection: 'users',
            id: jar.creator,
          })
        : jar.creator

    if (!creator?.accountNumber) {
      throw new APIError("Mobile money contribution can't be made at this time", 400)
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
