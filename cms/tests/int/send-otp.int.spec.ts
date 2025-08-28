import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach, vi } from 'vitest'

import { paystack } from '@/payload.config'

import { sendOtp } from '../../src/collections/Contributions/endpoints/send-otp'
import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'

describe('SendOtp Endpoint Integration Tests', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  beforeEach(async () => {
    await clearAllCollections(payload)
    vi.clearAllMocks()
  })

  describe('POST /api/contributions/send-otp - Validation Tests', () => {
    // Test 1: Missing reference and OTP should return 400
    it('should return 400 when both reference and OTP are missing', async () => {
      const mockRequest: any = {
        data: {},
      }

      const response = await sendOtp(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        success: false,
        message: 'Reference and OTP are required',
      })
    })

    // Test 2: Missing reference should return 400
    it('should return 400 when reference is missing', async () => {
      const mockRequest: any = {
        data: {
          otp: '123456',
        },
      }

      const response = await sendOtp(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        success: false,
        message: 'Reference and OTP are required',
      })
    })

    // Test 3: Missing OTP should return 400
    it('should return 400 when OTP is missing', async () => {
      const mockRequest: any = {
        data: {
          reference: 'test-reference-123',
        },
      }

      const response = await sendOtp(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        success: false,
        message: 'Reference and OTP are required',
      })
    })

    // Test 4: Empty string values should be treated as missing
    it('should return 400 when reference and OTP are empty strings', async () => {
      const mockRequest: any = {
        data: {
          reference: '',
          otp: '',
        },
      }

      const response = await sendOtp(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        success: false,
        message: 'Reference and OTP are required',
      })
    })
  })

  describe('POST /api/contributions/send-otp - Paystack Integration Tests', () => {
    // Test 5: Successful OTP submission should return 200
    it('should return 200 when OTP submission is successful', async () => {
      const mockRequest: any = {
        data: {
          reference: 'test-reference-123',
          otp: '123456',
        },
      }

      // Mock successful Paystack response
      const mockPaystackResponse = {
        status: true,
        message: 'Charge attempted',
        data: {
          reference: 'test-reference-123',
          status: 'success',
          amount: 10000,
        },
      }

      vi.spyOn(paystack, 'submitOtp').mockResolvedValue(mockPaystackResponse)

      const response = await sendOtp(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual({
        success: true,
        message: 'OTP submitted successfully',
        data: mockPaystackResponse.data,
      })

      // Verify Paystack was called with correct parameters
      expect(paystack.submitOtp).toHaveBeenCalledWith({
        reference: 'test-reference-123',
        otp: '123456',
      })
    })

    // Test 6: Failed OTP submission should return 400
    it('should return 400 when OTP submission fails', async () => {
      const mockRequest: any = {
        data: {
          reference: 'test-reference-123',
          otp: '000000', // Invalid OTP
        },
      }

      // Mock failed Paystack response
      const mockPaystackResponse = {
        status: false,
        message: 'Invalid OTP',
        data: null,
      }

      vi.spyOn(paystack, 'submitOtp').mockResolvedValue(mockPaystackResponse)

      const response = await sendOtp(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        success: false,
        message: 'OTP submission failed',
        error: 'Invalid OTP',
        data: null,
      })

      expect(paystack.submitOtp).toHaveBeenCalledWith({
        reference: 'test-reference-123',
        otp: '000000',
      })
    })

    // Test 7: Failed OTP submission without error message should use default
    it('should use default error message when Paystack response has no message', async () => {
      const mockRequest: any = {
        data: {
          reference: 'test-reference-123',
          otp: '999999',
        },
      }

      // Mock failed Paystack response without message
      const mockPaystackResponse = {
        status: false,
        message: '', // Empty message to test default fallback
        data: { error: 'Unknown error occurred' },
      }

      vi.spyOn(paystack, 'submitOtp').mockResolvedValue(mockPaystackResponse)

      const response = await sendOtp(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData).toEqual({
        success: false,
        message: 'OTP submission failed',
        error: 'Invalid OTP or reference',
        data: { error: 'Unknown error occurred' },
      })
    })

    // Test 8: Paystack service throwing exception should return 500
    it('should return 500 when Paystack service throws an exception', async () => {
      const mockRequest: any = {
        data: {
          reference: 'test-reference-123',
          otp: '123456',
        },
      }

      // Mock Paystack throwing an error
      const mockError = new Error('Network timeout')
      vi.spyOn(paystack, 'submitOtp').mockRejectedValue(mockError)

      const response = await sendOtp(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        success: false,
        message: 'Failed to submit OTP',
        error: 'Network timeout',
      })
    })

    // Test 9: Paystack service throwing exception without message should use default
    it('should use default error message when exception has no message', async () => {
      const mockRequest: any = {
        data: {
          reference: 'test-reference-123',
          otp: '123456',
        },
      }

      // Mock Paystack throwing an error without message
      const mockError = new Error()
      mockError.message = ''
      vi.spyOn(paystack, 'submitOtp').mockRejectedValue(mockError)

      const response = await sendOtp(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData).toEqual({
        success: false,
        message: 'Failed to submit OTP',
        error: 'Unknown error',
      })
    })

    // Test 10: Different OTP formats should be accepted
    it('should accept different OTP formats', async () => {
      const testCases = [
        { otp: '123456', description: 'standard 6-digit OTP' },
        { otp: '1234', description: '4-digit OTP' },
        { otp: '12345678', description: '8-digit OTP' },
      ]

      for (const testCase of testCases) {
        const mockRequest: any = {
          data: {
            reference: 'test-reference-123',
            otp: testCase.otp,
          },
        }

        const mockPaystackResponse = {
          status: true,
          message: 'Charge attempted',
          data: { reference: 'test-reference-123' },
        }

        vi.spyOn(paystack, 'submitOtp').mockResolvedValue(mockPaystackResponse)

        const response = await sendOtp(mockRequest)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        expect(responseData.success).toBe(true)
        expect(paystack.submitOtp).toHaveBeenCalledWith({
          reference: 'test-reference-123',
          otp: testCase.otp,
        })
      }
    })
  })
})
