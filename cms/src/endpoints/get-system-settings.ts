import type { PayloadHandler } from 'payload'

/**
 * Get System Settings Endpoint
 *
 * Returns public system settings like transfer fee percentage
 * Used by mobile app to calculate fees and display relevant information
 */
export const getSystemSettings: PayloadHandler = async (req, res) => {
  try {
    const { payload } = req

    // Fetch system settings global
    const settings = await payload.findGlobal({
      slug: 'system-settings',
      overrideAccess: false, // Use access control (read is public)
    })

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'System settings not found',
      })
    }

    // Return public settings
    return res.status(200).json({
      success: true,
      data: {
        transferFeePercentage: settings.transferFeePercentage || 1,
        minimumPayoutAmount: settings.minimumPayoutAmount || 10,
        payoutProcessingMessage: settings.payoutProcessingMessage || null,
      },
    })
  } catch (error: any) {
    console.error('Error fetching system settings:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error.message,
    })
  }
}
