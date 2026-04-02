import nock from 'nock'
import { beforeAll } from 'vitest'

// Override real credentials with dummy values so real keys are never used in tests
process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock'
process.env.RESEND_API_KEY = 'test_resend_key'
process.env.SMS_USERNAME = 'test_sms_user'
process.env.SMS_PASS = 'test_sms_pass'
process.env.SMS_SOURCE = 'TEST'
process.env.DIDIT_KYC_API_KEY = 'test_didit_key'
process.env.DIDIT_WORKFLOW_ID = 'test_workflow_id'

beforeAll(() => {
  nock.disableNetConnect()
  nock.enableNetConnect((host) => host.includes('127.0.0.1') || host.includes('localhost'))

  // Paystack
  nock('https://api.paystack.co')
    .persist()
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
    .get('/balance')
    .reply(200, {
      status: true,
      message: 'Balances retrieved',
      data: [{ currency: 'GHS', balance: 1000000 }],
    })
    // Create refund
    .post('/refund')
    .reply(200, {
      status: true,
      message: 'Refund has been queued for processing',
      data: {
        id: 1234567,
        status: 'pending',
        transaction: { id: 999, reference: 'mock-ref-123', amount: 10000, currency: 'GHS' },
        amount: 10000,
        currency: 'GHS',
        channel: 'mobile_money',
      },
    })
    // Get refund by ID
    .get(/\/refund\/.*/)
    .reply(200, {
      status: true,
      message: 'Refund retrieved',
      data: {
        id: 1234567,
        status: 'processed',
        transaction: { id: 999, reference: 'mock-ref-123', amount: 10000, currency: 'GHS' },
        amount: 10000,
        currency: 'GHS',
        channel: 'mobile_money',
      },
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
