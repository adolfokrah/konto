import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach, vi } from 'vitest'

import { verifyPayment } from '../../src/collections/Contributions/endpoints/verify-payment'
import { paystack } from '../../src/payload.config'
import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'

describe('VerifyPayment Endpoint Integration Tests', () => {
  let payload: Payload
  let testUser: any
  let testJar: any

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  beforeEach(async () => {
    await clearAllCollections(payload)
    vi.clearAllMocks()

    // Create test user
    testUser = await payload.create({
      collection: 'users',
      data: {
        email: 'creator@test.com',
        password: 'password123',
        fullName: 'Creator User',
        phoneNumber: '+233500000001',
        country: 'gh',
        accountNumber: '0244123456',
        bank: 'mtn',
        accountHolder: 'Creator User',
        isKYCVerified: true,
      },
    })

    // Create test jar
    testJar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Test Verify Jar',
        creator: testUser.id,
        currency: 'ghc',
        status: 'open',
        isActive: true,

        acceptAnonymousContributions: false,
        isFixedContribution: false,
        goalAmount: 0,
      },
    })
  })

  describe('POST /api/contributions/verify-payment - Core Tests', () => {
    it('should return 400 when reference is missing', async () => {
      const mockRequest: any = {
        data: {},
        payload,
      }

      const response = await verifyPayment(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.message).toBe('Reference is required')
    })

    it('should return 404 when contribution with reference is not found', async () => {
      // Mock successful Paystack response but no matching contribution
      vi.spyOn(paystack, 'checkTransactionStatus').mockResolvedValue({
        status: true,
        data: { status: 'success', amount: 100000, currency: 'GHS' },
        message: 'Transaction verified successfully',
      })

      const mockRequest: any = {
        data: { reference: 'non-existent-ref' },
        payload,
      }

      const response = await verifyPayment(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.message).toBe('Contribution not found')
    })
  })
})
