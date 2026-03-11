import type { PayloadRequest } from 'payload'

export const validateToken = async (req: PayloadRequest) => {
  try {
    // The user is automatically available if the token is valid
    // Payload automatically validates the JWT token in the Authorization header
    const { user } = req

    if (!user) {
      return Response.json(
        {
          success: false,
          message: 'Invalid or expired token',
          valid: false,
        },
        { status: 401 },
      )
    }

    // Track daily active user (fire-and-forget)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    ;(async () => {
      try {
        const existing = await req.payload.find({
          collection: 'dailyActiveUsers',
          where: {
            user: { equals: user.id },
            createdAt: {
              greater_than_equal: today.toISOString(),
              less_than: tomorrow.toISOString(),
            },
          },
          limit: 1,
          overrideAccess: true,
        })
        if (existing.docs.length === 0) {
          await req.payload.create({
            collection: 'dailyActiveUsers',
            data: { user: user.id },
            overrideAccess: true,
          })
        }
      } catch {}
    })()

    // Return success with user data
    return Response.json({
      success: true,
      message: 'Token is valid',
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: (user as any).fullName,
        phoneNumber: (user as any).phoneNumber,
        countryCode: (user as any).countryCode,
        country: (user as any).country,
        isKYCVerified: (user as any).isKYCVerified,
        appSettings: (user as any).appSettings,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error: any) {
    // Log error in development only
    if (process.env.NODE_ENV !== 'production') {
      console.error('💥 Token validation error:', error)
    }

    return Response.json(
      {
        success: false,
        message: 'Token validation failed',
        valid: false,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 401 },
    )
  }
}
