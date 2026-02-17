import type { PayloadRequest } from 'payload'

/**
 * Get System Settings Endpoint
 *
 * Returns public system settings like collection fee and transfer fee percentages
 * Used by mobile app to calculate fees and display relevant information
 */
export const getSystemSettings = async (req: PayloadRequest) => {
  try {
    const { payload } = req

    // Fetch system settings global
    const settings = await payload.findGlobal({
      slug: 'system-settings',
      overrideAccess: true, // Public endpoint - bypass auth for mobile app access
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
          collectionFee: settings.collectionFee ?? 1.95,
          transferFeePercentage: settings.transferFeePercentage ?? 1,
          minimumPayoutAmount: settings.minimumPayoutAmount ?? 10,
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
