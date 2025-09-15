import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach } from 'vitest'

import { verifyAccountDetails } from '@collections/Users/endpoints/verify-account-details'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'

let payload: Payload

describe('Verify Account Details Endpoint Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await clearAllCollections(payload) // Clear collections before tests
  })

  beforeEach(async () => {
    // Clear all users except admin users before each test
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          not_equals: 'admin@test.com',
        },
      },
    })

    for (const user of users.docs) {
      await payload.delete({
        collection: 'users',
        id: user.id,
      })
    }
  })

  describe('POST /api/users/verify-account-details - Validation Tests', () => {
    const validPhoneNumber = '+233541234567'
    const validBank = 'mtn'
    const validName = 'John Doe'

    it('should return error when phone number is missing', async () => {
      const mockRequest = {
        payload,
        data: {
          bank: validBank,
          name: validName,
        },
      } as any

      const response = await verifyAccountDetails(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.valid).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should return error when bank is missing', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: validPhoneNumber,
          name: validName,
        },
      } as any

      const response = await verifyAccountDetails(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.valid).toBe(false)
      expect(responseData.message).toBe('Bank is required')
    })

    it('should return error when all required fields are missing', async () => {
      const mockRequest = {
        payload,
        data: {},
      } as any

      const response = await verifyAccountDetails(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401) // Phone number check comes first
      expect(responseData.success).toBe(false)
      expect(responseData.valid).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should validate empty string inputs', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '',
          bank: '',
          name: '',
        },
      } as any

      const response = await verifyAccountDetails(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.valid).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should handle null and undefined values', async () => {
      const testCases = [
        { phoneNumber: null, bank: validBank, name: validName },
        { phoneNumber: undefined, bank: validBank, name: validName },
        { phoneNumber: validPhoneNumber, bank: null, name: validName },
        { phoneNumber: validPhoneNumber, bank: undefined, name: validName },
        { phoneNumber: validPhoneNumber, bank: validBank, name: null },
        { phoneNumber: validPhoneNumber, bank: validBank, name: undefined },
      ]

      for (const testData of testCases) {
        const mockRequest = {
          payload,
          data: testData,
        } as any

        const response = await verifyAccountDetails(mockRequest)
        const responseData = await response.json()

        expect(responseData.success).toBe(false)

        if (!testData.phoneNumber) {
          expect(response.status).toBe(401)
          expect(responseData.message).toBe('Phone number is required')
        } else if (!testData.bank) {
          expect(response.status).toBe(400)
          expect(responseData.message).toBe('Bank is required')
        }
      }
    })

    it('should handle bank code mapping for different providers', async () => {
      // Test that the endpoint accepts valid bank providers
      // Note: This will likely fail due to missing Paystack API key in test env,
      // but will test the validation logic
      const validBanks = ['mtn', 'vodafone', 'airteltico', 'mpesa']

      for (const bank of validBanks) {
        const mockRequest = {
          payload,
          data: {
            phoneNumber: validPhoneNumber,
            bank,
            name: validName,
          },
        } as any

        const response = await verifyAccountDetails(mockRequest)
        const responseData = await response.json()

        // Should not fail on validation (but may fail on Paystack API call)
        expect(responseData.message).not.toBe('Phone number is required')
        expect(responseData.message).not.toBe('Bank is required')
        expect(responseData.message).not.toBe('Name is required')
      }
    })

    it('should handle case insensitive bank names', async () => {
      const bankVariations = ['MTN', 'Mtn', 'mTn', 'VODAFONE', 'Vodafone', 'vodafone']

      for (const bank of bankVariations) {
        const mockRequest = {
          payload,
          data: {
            phoneNumber: validPhoneNumber,
            bank,
            name: validName,
          },
        } as any

        const response = await verifyAccountDetails(mockRequest)
        const responseData = await response.json()

        // Should not fail on validation (but may fail on Paystack API call)
        expect(responseData.message).not.toBe('Phone number is required')
        expect(responseData.message).not.toBe('Bank is required')
        expect(responseData.message).not.toBe('Name is required')
      }
    })

    it('should accept different phone number formats', async () => {
      const phoneFormats = ['+233541234567', '0541234567', '233541234567', '+233 54 123 4567']

      for (const phoneNumber of phoneFormats) {
        const mockRequest = {
          payload,
          data: {
            phoneNumber,
            bank: validBank,
            name: validName,
          },
        } as any

        const response = await verifyAccountDetails(mockRequest)
        const responseData = await response.json()

        // Should not fail on phone number validation
        expect(responseData.message).not.toBe('Phone number is required')
      }
    })
  })

  describe('POST /api/users/verify-account-details - Integration Tests', () => {
    const validPhoneNumber = '+233541234567'
    const validBank = 'mtn'
    const validName = 'John Doe'

    it('should handle Paystack API integration gracefully when API key is missing', async () => {
      // This test checks that the endpoint handles missing Paystack configuration
      const mockRequest = {
        payload,
        data: {
          phoneNumber: validPhoneNumber,
          bank: validBank,
          name: validName,
        },
      } as any

      const response = await verifyAccountDetails(mockRequest)
      const responseData = await response.json()

      // Should return 500 if Paystack integration fails due to missing API key
      // or other configuration issues
      expect([400, 500]).toContain(response.status)
      expect(responseData.success).toBe(false)
      expect(responseData.valid).toBe(false)
      expect(typeof responseData.message).toBe('string')
    })
  })
})
