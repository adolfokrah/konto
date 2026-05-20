import nock from 'nock'
import { beforeAll } from 'vitest'

// Override real credentials with dummy values so real keys are never used in tests
process.env.CHANGO_API_KEY = 'test_chango_key'
process.env.CHANGO_GROUP_ID = 'test_group_id'
process.env.CHANGO_PAYMENT_DESTINATION_NUMBER = '0000000000'
process.env.CHANGO_BANK_ID = 'test_bank_id'
process.env.CHANGO_BRANCH_ID = 'test_branch_id'
process.env.CHANGO_MERCHANT_PRODUCT_ID = 'test_merchant_product_id'
process.env.RESEND_API_KEY = 'test_resend_key'
process.env.SMS_USERNAME = 'test_sms_user'
process.env.SMS_PASS = 'test_sms_pass'
process.env.SMS_SOURCE = 'TEST'
process.env.DIDIT_KYC_API_KEY = 'test_didit_key'
process.env.DIDIT_WORKFLOW_ID = 'test_workflow_id'

beforeAll(() => {
  nock.disableNetConnect()
  nock.enableNetConnect((host) => host.includes('127.0.0.1') || host.includes('localhost'))

  // Chango
  nock('https://thirdpartyuat.changoapp.com')
    .persist()
    .post(/.*/)
    .reply(200, {
      response_code: '200',
      response_message: 'OK',
      data: {
        success: true,
        invoiceId: 'mock-invoice',
        checkoutTransactionReference: 'mock-checkout-ref',
        checkoutUrl: 'https://checkoutuat.itcsrvc.com/mock',
      },
    })
    .put(/.*/)
    .reply(200, { response_code: '200', response_message: 'OK', data: {} })
    .get(/.*/)
    .reply(200, { response_code: '200', response_message: 'OK', data: { count: 0, data: [] } })

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
