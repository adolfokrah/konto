import type { PayloadRequest } from 'payload'

/**
 * Get System Settings Endpoint
 *
 * Returns public system settings like transfer fee percentage
 * Used by mobile app to calculate fees and display relevant information
 */
export const getSystemSettings = async (req: PayloadRequest) => {
  try {
    const { payload } = req

    // Fetch system settings global
    const settings = await payload.findGlobal({
      slug: 'system-settings',
      overrideAccess: false, // Use access control (read is public)
    })

    if (!settings) {
      return Response.json(
        {
          success: false,
          message: 'System settings not found',
        },
        { status: 404 },
      )
    }

    // Return public settings
    return Response.json(
      {
        success: true,
        data: {
          transferFeePercentage: settings.transferFeePercentage || 1,
          minimumPayoutAmount: settings.minimumPayoutAmount || 10,
          payoutProcessingMessage: settings.payoutProcessingMessage || null,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error fetching system settings:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to fetch system settings',
        error: error.message,
      },
      { status: 500 },
    )
  }
}
