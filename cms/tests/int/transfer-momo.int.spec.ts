import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach, vi } from 'vitest'

import { paystack } from '@/payload.config'

import { transferMomo } from '../../src/collections/Contributions/endpoints/transfer-momo'
import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'

describe('TransferMomo Endpoint Integration Tests', () => {
  let payload: Payload
  let testUser: any
  let testJar: any

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  beforeEach(async () => {
    await clearAllCollections(payload)
    vi.clearAllMocks()

    // Create test user with bank information
    testUser = await payload.create({
      collection: 'users',
      data: {
        email: 'creator@test.com',
        password: 'password123',
        fullName: 'Creator User',
        phoneNumber: '+233500000001',
        country: 'gh' as const,
        bank: 'mtn',
        accountNumber: '0244123456',
        accountHolder: 'Creator User',
        isKYCVerified: true,
      },
    })

    // Create test jar
    testJar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Test Transfer Jar',
        status: 'open',
        currency: 'GHS' as const,
        creator: testUser.id,
        isActive: true,
        invitedCollectors: [],
      },
    })
  })

  describe('POST /api/contributions/transfer-momo - Core Tests', () => {
    // Test 1: Missing contribution ID should return 400
    it('should return 400 when contribution ID is missing', async () => {
      const mockRequest: any = {
        data: {},
        payload,
      }

      const response = await transferMomo(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        success: false,
        message: 'Contribution ID is required',
      })
    })

    // Test 2: Already transferred contribution should return 400
    it('should return 400 when contribution has already been transferred', async () => {
      const transferredContribution = await payload.create({
        collection: 'contributions',
        data: {
          jar: testJar.id,
          collector: testUser.id,
          amountContributed: 100000,
          paymentMethod: 'mobile-money',
          paymentStatus: 'completed',
          isTransferred: true,
          contributorPhoneNumber: '+233500000002',
          mobileMoneyProvider: 'mtn',
          type: 'contribution' as const,
        },
      })

      const mockRequest: any = {
        data: {
          contributionId: transferredContribution.id,
        },
        payload,
      }

      const response = await transferMomo(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        success: false,
        message: 'Contribution has already been transferred',
      })
    })

    // Test 3: Successful testing mode transfer should return 200
    it('should successfully create transfer record in testing mode', async () => {
      const contribution = await payload.create({
        collection: 'contributions',
        data: {
          jar: testJar.id,
          collector: testUser.id,
          amountContributed: 100000,
          paymentMethod: 'mobile-money',
          paymentStatus: 'completed',
          contributorPhoneNumber: '+233500000002',
          mobileMoneyProvider: 'mtn',
          type: 'contribution' as const,
        },
      })

      const mockRequest: any = {
        data: {
          contributionId: contribution.id,
          testing: true,
        },
        payload,
      }

      const response = await transferMomo(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual({
        success: true,
        message: 'Transfer record created successfully',
      })

      // Verify the original contribution is marked as transferred
      const updatedContribution = await payload.findByID({
        collection: 'contributions',
        id: contribution.id,
      })
      expect(updatedContribution.isTransferred).toBe(true)
      expect(updatedContribution.linkedTransfer).toBeDefined()
    })

    // Test 4: Failed Paystack transfer should return 500
    it('should return 500 when Paystack transfer fails', async () => {
      const contribution = await payload.create({
        collection: 'contributions',
        data: {
          jar: testJar.id,
          collector: testUser.id,
          amountContributed: 100000,
          paymentMethod: 'mobile-money',
          paymentStatus: 'completed',
          contributorPhoneNumber: '+233500000002',
          mobileMoneyProvider: 'mtn',
          type: 'contribution' as const,
        },
      })

      // Mock failed Paystack response
      const mockPaystackResponse = {
        status: false,
        message: 'Transfer failed',
        data: null,
      }

      vi.spyOn(paystack, 'initiateTransfer').mockResolvedValue(mockPaystackResponse)

      const mockRequest: any = {
        data: {
          contributionId: contribution.id,
          testing: false,
        },
        payload,
      }

      const response = await transferMomo(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        success: false,
        message: 'Failed to transfer payment',
        error: 'Failed',
      })
    })

    // Test 5: Paystack service exception should return 500
    it('should return 500 when Paystack service throws an exception', async () => {
      const contribution = await payload.create({
        collection: 'contributions',
        data: {
          jar: testJar.id,
          collector: testUser.id,
          amountContributed: 100000,
          paymentMethod: 'mobile-money',
          paymentStatus: 'completed',
          contributorPhoneNumber: '+233500000002',
          mobileMoneyProvider: 'mtn',
          type: 'contribution' as const,
        },
      })

      // Mock Paystack throwing an error
      const mockError = new Error('Network timeout')
      vi.spyOn(paystack, 'initiateTransfer').mockRejectedValue(mockError)

      const mockRequest: any = {
        data: {
          contributionId: contribution.id,
          testing: false,
        },
        payload,
      }

      const response = await transferMomo(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        success: false,
        message: 'Failed to transfer payment',
        error: 'Network timeout',
      })
    })
  })
})
