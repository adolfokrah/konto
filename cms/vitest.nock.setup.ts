import nock from 'nock'
import { beforeAll } from 'vitest'

// Override real credentials with dummy values so real keys are never used in tests
process.env.EGANOW_SECRET_USERNAME = 'test_username'
process.env.EGANOW_SECRET_PASSWORD = 'test_password'
process.env.EGANOW_X_AUTH_TOKEN = 'test_x_auth'
process.env.RESEND_API_KEY = 'test_resend_key'
process.env.SMS_USERNAME = 'test_sms_user'
process.env.SMS_PASS = 'test_sms_pass'
process.env.SMS_SOURCE = 'TEST'
process.env.DIDIT_KYC_API_KEY = 'test_didit_key'
process.env.DIDIT_WORKFLOW_ID = 'test_workflow_id'

const EGANOW_BASE = 'https://developer.deveganowapi.com'


console.log('EGANOW_BASE', process.env.EGANOW_SECRET_PASSWORD)

beforeAll(() => {
  nock.disableNetConnect()
  nock.enableNetConnect((host) => host.includes('127.0.0.1') || host.includes('localhost'))

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
