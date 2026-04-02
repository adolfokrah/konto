import nock from 'nock'
import { beforeAll } from 'vitest'

// Override real credentials with dummy values so real keys are never used in tests
process.env.EGANOW_SECRET_USERNAME = 'test_username'
process.env.EGANOW_SECRET_PASSWORD = 'test_password'
process.env.EGANOW_X_AUTH_TOKEN = 'test_x_auth'
process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock'
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

  // Paystack
  const PAYSTACK_BASE = 'https://api.paystack.co'
  nock(PAYSTACK_BASE)
    .persist()
    // Initialize transaction (contributions)
    .post('/transaction/initialize')
    .reply(200, {
      status: true,
      message: 'Authorization URL created',
      data: {
        authorization_url: 'https://checkout.paystack.com/mock',
        access_code: 'mock-access-code',
        reference: 'mock-ref-123',
      },
    })
    // Verify transaction (contributions)
    .get(/\/transaction\/verify\/.*/)
    .reply(200, {
      status: true,
      message: 'Verification successful',
      data: {
        status: 'success',
        reference: 'mock-ref-123',
        amount: 10000,
        currency: 'GHS',
        channel: 'mobile_money',
        customer: { email: 'test@example.com' },
        authorization: { bank: 'mtn' },
      },
    })
    // Create transfer recipient (payouts)
    .post('/transferrecipient')
    .reply(200, {
      status: true,
      message: 'Transfer recipient created',
      data: {
        recipient_code: 'RCP_mock123',
        type: 'mobile_money',
        name: 'Test User',
      },
    })
    // Initiate transfer (payouts)
    .post('/transfer')
    .reply(200, {
      status: true,
      message: 'Transfer initiated',
      data: {
        transfer_code: 'TRF_mock123',
        reference: 'mock-transaction-id',
        status: 'pending',
        amount: 9900,
        currency: 'GHS',
      },
    })
    // Verify transfer status (payout cron)
    .get(/\/transfer\/.*/)
    .reply(200, {
      status: true,
      message: 'Transfer retrieved',
      data: {
        transfer_code: 'TRF_mock123',
        reference: 'mock-transaction-id',
        status: 'success',
        amount: 9900,
        currency: 'GHS',
      },
    })
    // Paystack balance
    .get('/balance')
    .reply(200, {
      status: true,
      message: 'Balances retrieved',
      data: [{ currency: 'GHS', balance: 1000000 }],
    })

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
