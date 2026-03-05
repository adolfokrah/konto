// Any setup scripts you might need go here
// Load .env files
import 'dotenv/config'
import { afterEach, beforeAll } from 'vitest'
import nock from 'nock'

// ── Nock: block all external HTTP requests across all tests ──
const EGANOW_BASE = 'https://developer.deveganowapi.com'

beforeAll(() => {
  // Disable all real HTTP requests
  nock.disableNetConnect()
  // Allow localhost (for MongoDB, Payload local API, etc.)
  nock.enableNetConnect((host) => host.includes('127.0.0.1') || host.includes('localhost'))
})

// Set up persistent mocks for all external services
beforeAll(() => {
  // Eganow
  nock(EGANOW_BASE)
    .persist()
    .get('/api/auth/token')
    .reply(200, {
      isSuccess: true,
      message: 'Token generated',
      egaMerchantId: 'MOCK-MERCHANT',
      developerJwtToken: 'mock-jwt-token',
    })
    .post('/api/transactions/payout')
    .reply(200, {
      transactionStatus: 'INITIATED',
      eganowReferenceNo: 'MOCK-REF-123',
      message: 'Payout initiated',
    })
    .post('/api/transactions/status')
    .reply(200, {
      isSuccess: true,
      transactionstatus: 'SUCCESSFUL',
      referenceNo: 'MOCK-REF-123',
    })
    .post('/api/vas/kyc')
    .reply(200, { isSuccess: true, message: 'Verified' })
    .post('/api/partners/charges')
    .reply(200, { isSuccess: true, charges: 0 })
    .post('/api/transactions/collection')
    .reply(200, { isSuccess: true, message: 'Collection initiated' })
    .get('/api/transactions/payout/get-balance')
    .reply(200, { isSuccess: true, balance: 10000 })
    .get('/api/transactions/collection/get-balance')
    .reply(200, { isSuccess: true, balance: 10000 })

  // SMS (Deywuro)
  nock('https://www.deywuro.com')
    .persist()
    .post('/api/sms')
    .reply(200, { code: 0, message: 'SMS sent' })

  // Didit KYC
  nock('https://verification.didit.me')
    .persist()
    .post(/.*/)
    .reply(200, { id: 'mock-session', status: 'approved' })
    .get(/.*/)
    .reply(200, { id: 'mock-session', status: 'approved' })
    .delete(/.*/)
    .reply(200, { id: 'mock-session', status: 'deleted' })

  // Resend email
  nock('https://api.resend.com')
    .persist()
    .post(/.*/)
    .reply(200, { id: 'mock-email-id' })
})

// Fix for jsdom environment in CI
beforeAll(() => {
  if (typeof global !== 'undefined' && !global.window) {
    Object.defineProperty(global, 'TextEncoder', {
      value: TextEncoder,
    })

    Object.defineProperty(global, 'TextDecoder', {
      value: TextDecoder,
    })
  }
})
