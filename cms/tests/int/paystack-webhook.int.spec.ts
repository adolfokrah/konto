import crypto from 'crypto'

import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach, vi } from 'vitest'

import { paystack } from '@/payload.config'

import { paystackWebhook } from '../../src/collections/Contributions/endpoints/paystack-webhook'
import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'

let payload: Payload

// Mock the Paystack service
vi.mock('@/payload.config', async () => {
  const actual = await vi.importActual('@/payload.config')
  return {
    ...actual,
    paystack: {
      checkTransactionStatus: vi.fn(),
    },
  }
})

const mockPaystack = vi.mocked(paystack)

// Helper to create valid Paystack webhook signature
const createWebhookSignature = (payload: string, secret: string) => {
  return crypto.createHmac('sha512', secret).update(payload).digest('hex')
}

// Mock webhook payloads
const createWebhookPayload = (event: string, reference: string) => ({
  event,
  data: {
    reference,
    amount: 5000,
    currency: 'GHS',
    status: event.includes('success') ? 'success' : 'failed',
    gateway_response: event.includes('success') ? 'Successful' : 'Failed',
  },
})

describe('Paystack Webhook Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await clearAllCollections(payload)
  })

  beforeEach(async () => {
    await clearAllCollections(payload)
    vi.clearAllMocks()

    // Set up mock environment variable
    process.env.PAYSTACK_SECRET = 'test-secret-key'
  })

  // Test 1: Missing arrayBuffer should return 400
  it('should return 400 when request has no arrayBuffer', async () => {
    const mockRequest: any = {
      // Missing arrayBuffer method
      headers: {
        get: vi.fn().mockReturnValue('test-signature'),
      },
    }

    const response = await paystackWebhook(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toEqual({
      error: 'Bad Request',
    })
  })

  // Test 2: Invalid signature should return 401
  it('should return 401 when signature is invalid', async () => {
    const webhookPayload = createWebhookPayload('charge.success', 'test-ref-123')
    const payloadString = JSON.stringify(webhookPayload)
    const payloadBuffer = Buffer.from(payloadString)

    const mockRequest: any = {
      arrayBuffer: vi.fn().mockResolvedValue(payloadBuffer.buffer),
      headers: {
        get: vi.fn((headerName: string) => {
          if (headerName === 'x-paystack-signature') {
            return 'invalid-signature-here'
          }
          return null
        }),
      },
    }

    const response = await paystackWebhook(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(401)
    expect(responseData).toEqual({
      error: 'Unauthorized',
    })
  })

  // Test 3: Valid signature should return 200
  it('should return 200 for valid charge.success webhook', async () => {
    const webhookData = {
      event: 'charge.success',
      data: {
        reference: 'test-reference-123',
        amount: 10000,
        status: 'success',
      },
    }

    const rawBuffer = Buffer.from(JSON.stringify(webhookData), 'utf8')

    // Calculate the correct signature using PAYSTACK_SECRET
    const secret = process.env.PAYSTACK_SECRET!
    const expectedHash = crypto.createHmac('sha512', secret).update(rawBuffer).digest('hex')

    const mockRequest: any = {
      arrayBuffer: vi.fn().mockResolvedValue(rawBuffer),
      headers: {
        get: vi.fn((headerName: string) => {
          if (headerName === 'x-paystack-signature') return expectedHash
          return null
        }),
      },
    }

    const response = await paystackWebhook(mockRequest)

    expect(response.status).toBe(200)
    // Webhook should acknowledge receipt immediately
    expect(await response.text()).toBe('')
  })
})
