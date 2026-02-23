'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createDiditKYC, type DiditSessionDecision } from '@/utilities/diditKyc'
import { sendSMS } from '@/utilities/sms'
import { emailService } from '@/utilities/emailService'

type ActionResult = {
  success: boolean
  message: string
  kycStatus?: string
}

type DecisionResult = {
  success: boolean
  decision?: DiditSessionDecision
  error?: string
}

/**
 * Fetch the latest KYC status from Didit API and update the user
 */
export async function checkDiditKycStatus(
  userId: string,
  sessionId: string,
): Promise<ActionResult> {
  try {
    const didit = createDiditKYC()
    const session = await didit.getSessionStatus(sessionId)

    // Map Didit status to our kycStatus
    let kycStatus: 'none' | 'in_review' | 'verified'
    switch (session.status) {
      case 'Approved':
        kycStatus = 'verified'
        break
      case 'Declined':
      case 'Abandoned':
        kycStatus = 'none'
        break
      default:
        kycStatus = 'in_review'
    }

    const payload = await getPayload({ config: configPromise })
    const user = await payload.update({
      collection: 'users',
      id: userId,
      data: { kycStatus },
      overrideAccess: true,
    })

    // Send notifications if verified
    if (kycStatus === 'verified') {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
      if (process.env.NODE_ENV !== 'test') {
        await sendSMS(
          [user.phoneNumber],
          `Hello ${fullName}, your KYC verification was successful, please restart the app to continue using it. Thank you!`,
        )
      }
      await emailService.sendKycVerificationEmail(user.email, fullName)
    }

    return {
      success: true,
      message: `Didit status: ${session.status}. KYC updated to "${kycStatus}".`,
      kycStatus,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to check Didit KYC status',
    }
  }
}

/**
 * Manually update a user's KYC status (admin action)
 */
export async function updateUserKycStatus(
  userId: string,
  kycStatus: 'none' | 'in_review' | 'verified',
): Promise<ActionResult> {
  try {
    const payload = await getPayload({ config: configPromise })
    const user = await payload.update({
      collection: 'users',
      id: userId,
      data: { kycStatus },
      overrideAccess: true,
    })

    // Send notifications if verified
    if (kycStatus === 'verified') {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
      if (process.env.NODE_ENV !== 'test') {
        await sendSMS(
          [user.phoneNumber],
          `Hello ${fullName}, your KYC verification was successful, please restart the app to continue using it. Thank you!`,
        )
      }
      await emailService.sendKycVerificationEmail(user.email, fullName)
    }

    return {
      success: true,
      message: `KYC status updated to "${kycStatus}"${kycStatus === 'verified' ? '. Notifications sent.' : '.'}`,
      kycStatus,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update KYC status',
    }
  }
}

/**
 * Fetch the full KYC decision from Didit API (ID verification, liveness, face match, AML)
 */
export async function fetchDiditDecision(sessionId: string): Promise<DecisionResult> {
  try {
    const didit = createDiditKYC()
    const decision = await didit.getSessionDecision(sessionId)
    return { success: true, decision }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch Didit decision',
    }
  }
}
