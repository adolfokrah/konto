import { getPayload, Payload } from 'payload'
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

import config from '@/payload.config'
import { payoutEganow } from '../../src/collections/Transactions/endpoints/payout-eganow'
import { clearAllCollections } from 'tests/utils/testCleanup'

let payload: Payload

describe('Payout Endpoint Integration Tests', () => {
  let creatorUser: any
  let otherUser: any
  let testJar: any

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await clearAllCollections(payload)
  })

  beforeEach(async () => {
    const transactions = await payload.find({ collection: 'transactions' })
    for (const tx of transactions.docs) {
      await payload.delete({ collection: 'transactions', id: tx.id })
    }

    const jars = await payload.find({ collection: 'jars' })
    for (const jar of jars.docs) {
      await payload.delete({ collection: 'jars', id: jar.id })
    }

    const users = await payload.find({
      collection: 'users',
      where: { email: { not_equals: 'admin@test.com' } },
    })
    for (const user of users.docs) {
      await payload.delete({ collection: 'users', id: user.id })
    }

    creatorUser = await payload.create({
      collection: 'users',
      data: {
        email: `payout-creator-${Date.now()}-${Math.random()}@example.com`,
        password: 'password123',
        firstName: 'Payout',
        lastName: 'Creator',
        username: `payoutcreator${Date.now()}`,
        phoneNumber: '+233000000001',
        country: 'gh' as const,
        kycStatus: 'verified',
        role: 'user',
        accountNumber: '0000000001',
        bank: 'mtn',
        accountHolder: 'Payout Creator',
      },
    })

    otherUser = await payload.create({
      collection: 'users',
      data: {
        email: `payout-other-${Date.now()}-${Math.random()}@example.com`,
        password: 'password123',
        firstName: 'Other',
        lastName: 'User',
        username: `payoutother${Date.now()}`,
        phoneNumber: '+233000000002',
        country: 'gh' as const,
        kycStatus: 'verified',
        role: 'user',
        accountNumber: '0000000002',
        bank: 'mtn',
        accountHolder: 'Other User',
      },
    })

    testJar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Payout Test Jar',
        status: 'open',
        currency: 'GHS' as const,
        creator: creatorUser.id,
        isActive: true,
      },
    })
  })

  async function createSettledContribution(jarId: string, amount: number) {
    const tx = await payload.create({
      collection: 'transactions',
      data: {
        jar: jarId,
        contributor: 'Test Contributor',
        contributorPhoneNumber: '+233000000099',
        paymentMethod: 'cash' as const,
        amountContributed: amount,
        collector: creatorUser.id,
        type: 'contribution' as const,
        isSettled: true,
      },
    })
    if (tx.paymentStatus !== 'completed') {
      throw new Error(`Expected paymentStatus 'completed' but got '${tx.paymentStatus}'`)
    }
    return tx
  }

  function buildMockRequest(overrides: Record<string, any> = {}) {
    const data = overrides.data ?? { jarId: testJar.id }
    return {
      payload,
      user: overrides.user === null ? null : (overrides.user ?? creatorUser),
      data,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => data,
    } as any
  }

  describe('Endpoint Validation', () => {
    it('should return 400 when jarId is missing', async () => {
      const req = buildMockRequest({ data: {} })
      const response = await payoutEganow(req)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Jar ID is required')
    })

    it('should return 400 when withdrawal account info is missing', async () => {
      const noBankUser = await payload.create({
        collection: 'users',
        data: {
          email: `payout-nobank-${Date.now()}-${Math.random()}@example.com`,
          password: 'password123',
          firstName: 'No',
          lastName: 'Bank',
          username: `payoutnobank${Date.now()}`,
          phoneNumber: '+233000000003',
          country: 'gh' as const,
          kycStatus: 'verified',
          role: 'user',
        },
      })

      const req = buildMockRequest({ user: noBankUser })
      const response = await payoutEganow(req)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toContain('Withdrawal account information is missing')
    })

    it('should return 403 when jar is frozen', async () => {
      const frozenJar = await payload.create({
        collection: 'jars',
        data: {
          name: 'Frozen Jar',
          status: 'frozen',
          currency: 'GHS' as const,
          creator: creatorUser.id,
          isActive: true,
          freezeReason: 'Suspicious activity',
        },
      })

      const req = buildMockRequest({ data: { jarId: frozenJar.id } })
      const response = await payoutEganow(req)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.success).toBe(false)
      expect(result.message).toContain('frozen')
    })

    it('should return 403 when user is not the jar creator', async () => {
      await createSettledContribution(testJar.id, 500)

      const req = buildMockRequest({ user: otherUser })
      const response = await payoutEganow(req)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Only the jar creator can request a payout')
    })

    it('should return 400 when a payout is already pending', async () => {
      await createSettledContribution(testJar.id, 500)

      await payload.create({
        collection: 'transactions',
        data: {
          jar: testJar.id,
          contributor: 'Payout Creator',
          contributorPhoneNumber: '0000000001',
          paymentMethod: 'mobile-money' as const,
          mobileMoneyProvider: 'mtn' as const,
          amountContributed: -500,
          collector: creatorUser.id,
          type: 'payout' as const,
          paymentStatus: 'pending',
        },
      })

      const req = buildMockRequest()
      const response = await payoutEganow(req)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toBe('A payout is already pending for this jar')
    })

    it('should return 400 when jar has no balance', async () => {
      const req = buildMockRequest()
      const response = await payoutEganow(req)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toBe('No balance available for payout')
    })

    it('should return 400 when balance is zero after payouts', async () => {
      await createSettledContribution(testJar.id, 300)

      await payload.create({
        collection: 'transactions',
        data: {
          jar: testJar.id,
          contributor: 'Payout Creator',
          contributorPhoneNumber: '0000000001',
          paymentMethod: 'mobile-money' as const,
          mobileMoneyProvider: 'mtn' as const,
          amountContributed: -300,
          collector: creatorUser.id,
          type: 'payout' as const,
          paymentStatus: 'completed',
        },
      })

      const req = buildMockRequest()
      const response = await payoutEganow(req)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toBe('No balance available for payout')
    })

    it('should return 400 for unsupported mobile money provider', async () => {
      await createSettledContribution(testJar.id, 500)

      const unsupportedBankUser = await payload.create({
        collection: 'users',
        data: {
          email: `payout-badbank-${Date.now()}-${Math.random()}@example.com`,
          password: 'password123',
          firstName: 'Bad',
          lastName: 'Bank',
          username: `payoutbadbank${Date.now()}`,
          phoneNumber: '+233000000004',
          country: 'gh' as const,
          kycStatus: 'verified',
          role: 'user',
          accountNumber: '0000000004',
          bank: 'vodafone',
          accountHolder: 'Bad Bank User',
        },
      })

      await payload.update({
        collection: 'jars',
        id: testJar.id,
        data: { creator: unsupportedBankUser.id },
      })

      const req = buildMockRequest({ user: unsupportedBankUser })
      const response = await payoutEganow(req)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toContain('Unsupported mobile money provider')
    })
  })

  describe('Balance Calculation', () => {
    it('should only count settled completed contributions in balance', async () => {
      await createSettledContribution(testJar.id, 500)

      await payload.create({
        collection: 'transactions',
        data: {
          jar: testJar.id,
          contributor: 'Unsettled Contributor',
          contributorPhoneNumber: '+233000000088',
          paymentMethod: 'cash' as const,
          amountContributed: 1000,
          collector: creatorUser.id,
          type: 'contribution' as const,
          isSettled: false,
        },
      })

      await payload.create({
        collection: 'transactions',
        data: {
          jar: testJar.id,
          contributor: 'Pending Contributor',
          contributorPhoneNumber: '+233000000077',
          paymentMethod: 'mobile-money' as const,
          mobileMoneyProvider: 'mtn' as const,
          amountContributed: 2000,
          collector: creatorUser.id,
          type: 'contribution' as const,
          isSettled: false,
        },
      })

      const allTransactions = await payload.find({
        collection: 'transactions',
        where: { jar: { equals: testJar.id } },
        limit: 10000,
        overrideAccess: true,
      })

      const settledSum = allTransactions.docs
        .filter(
          (tx: any) =>
            tx.type === 'contribution' && tx.paymentStatus === 'completed' && tx.isSettled === true,
        )
        .reduce((sum: number, tx: any) => sum + tx.amountContributed, 0)

      const payoutsSum = allTransactions.docs
        .filter(
          (tx: any) =>
            tx.type === 'payout' &&
            (tx.paymentStatus === 'pending' || tx.paymentStatus === 'completed'),
        )
        .reduce((sum: number, tx: any) => sum + tx.amountContributed, 0)

      const netBalance = settledSum + payoutsSum

      expect(settledSum).toBe(500)
      expect(payoutsSum).toBe(0)
      expect(netBalance).toBe(500)
    })

    it('should subtract completed and pending payouts from balance', async () => {
      await createSettledContribution(testJar.id, 1000)

      await payload.create({
        collection: 'transactions',
        data: {
          jar: testJar.id,
          contributor: 'Payout Creator',
          contributorPhoneNumber: '0000000001',
          paymentMethod: 'mobile-money' as const,
          mobileMoneyProvider: 'mtn' as const,
          amountContributed: -400,
          collector: creatorUser.id,
          type: 'payout' as const,
          paymentStatus: 'completed',
        },
      })

      await payload.create({
        collection: 'transactions',
        data: {
          jar: testJar.id,
          contributor: 'Payout Creator',
          contributorPhoneNumber: '0000000001',
          paymentMethod: 'mobile-money' as const,
          mobileMoneyProvider: 'mtn' as const,
          amountContributed: -200,
          collector: creatorUser.id,
          type: 'payout' as const,
          paymentStatus: 'failed',
        },
      })

      const allTransactions = await payload.find({
        collection: 'transactions',
        where: { jar: { equals: testJar.id } },
        limit: 10000,
        overrideAccess: true,
      })

      const settledSum = allTransactions.docs
        .filter(
          (tx: any) =>
            tx.type === 'contribution' && tx.paymentStatus === 'completed' && tx.isSettled === true,
        )
        .reduce((sum: number, tx: any) => sum + tx.amountContributed, 0)

      const payoutsSum = allTransactions.docs
        .filter(
          (tx: any) =>
            tx.type === 'payout' &&
            (tx.paymentStatus === 'pending' || tx.paymentStatus === 'completed'),
        )
        .reduce((sum: number, tx: any) => sum + tx.amountContributed, 0)

      const netBalance = settledSum + payoutsSum

      expect(settledSum).toBe(1000)
      expect(payoutsSum).toBe(-400)
      expect(netBalance).toBe(600)
    })
  })

  describe('Process Payout Task', () => {
    it('should create a payout transaction with correct fields', async () => {
      await createSettledContribution(testJar.id, 500)

      const { processPayoutTask } = await import('../../src/tasks/process-payout')

      await processPayoutTask.handler({
        req: { payload },
        input: {
          jarId: testJar.id,
          userId: creatorUser.id,
          userBank: 'mtn',
          userAccountNumber: '0000000001',
          userAccountHolder: 'Payout Creator',
        },
      })

      const payoutTransactions = await payload.find({
        collection: 'transactions',
        where: {
          jar: { equals: testJar.id },
          type: { equals: 'payout' },
        },
        overrideAccess: true,
      })

      expect(payoutTransactions.docs.length).toBe(1)

      const payoutTx = payoutTransactions.docs[0]
      expect(payoutTx.type).toBe('payout')
      expect(payoutTx.amountContributed).toBe(-500)
      expect(payoutTx.paymentMethod).toBe('mobile-money')
      expect(payoutTx.mobileMoneyProvider).toBe('mtn')
      expect(payoutTx.payoutFeePercentage).toBeDefined()
      expect(payoutTx.payoutFeeAmount).toBeDefined()
      expect(payoutTx.payoutNetAmount).toBeDefined()
      expect(payoutTx.paymentStatus).toBe('pending')
      expect(payoutTx.transactionReference).toBe('MOCK-REF-123')
    })

    it('should calculate fee correctly based on system settings', async () => {
      await createSettledContribution(testJar.id, 1000)

      const systemSettings = await payload.findGlobal({ slug: 'system-settings' })
      const feePercentage = systemSettings?.transferFeePercentage || 1

      const { processPayoutTask } = await import('../../src/tasks/process-payout')

      await processPayoutTask.handler({
        req: { payload },
        input: {
          jarId: testJar.id,
          userId: creatorUser.id,
          userBank: 'mtn',
          userAccountNumber: '0000000001',
          userAccountHolder: 'Payout Creator',
        },
      })

      const payoutTransactions = await payload.find({
        collection: 'transactions',
        where: {
          jar: { equals: testJar.id },
          type: { equals: 'payout' },
        },
        overrideAccess: true,
      })

      expect(payoutTransactions.docs.length).toBe(1)

      const payoutTx = payoutTransactions.docs[0]
      const expectedFee = (1000 * feePercentage) / 100
      const expectedNetAmount = 1000 - expectedFee

      expect(payoutTx.payoutFeePercentage).toBe(feePercentage)
      expect(Math.abs(payoutTx.payoutFeeAmount as number)).toBe(expectedFee)
      expect(Math.abs(payoutTx.payoutNetAmount as number)).toBe(expectedNetAmount)
    })

    it('should skip if a pending payout already exists', async () => {
      await createSettledContribution(testJar.id, 500)

      await payload.create({
        collection: 'transactions',
        data: {
          jar: testJar.id,
          contributor: 'Payout Creator',
          contributorPhoneNumber: '0000000001',
          paymentMethod: 'mobile-money' as const,
          mobileMoneyProvider: 'mtn' as const,
          amountContributed: -500,
          collector: creatorUser.id,
          type: 'payout' as const,
          paymentStatus: 'pending',
        },
      })

      const { processPayoutTask } = await import('../../src/tasks/process-payout')

      const result = await processPayoutTask.handler({
        req: { payload },
        input: {
          jarId: testJar.id,
          userId: creatorUser.id,
          userBank: 'mtn',
          userAccountNumber: '0000000001',
          userAccountHolder: 'Payout Creator',
        },
      })

      expect(result.output.success).toBe(false)
      expect(result.output.message).toBe('A payout is already pending for this jar')
    })

    it('should return error when jar is frozen', async () => {
      await createSettledContribution(testJar.id, 500)

      await payload.update({
        collection: 'jars',
        id: testJar.id,
        data: { status: 'frozen' },
      })

      const { processPayoutTask } = await import('../../src/tasks/process-payout')

      const result = await processPayoutTask.handler({
        req: { payload },
        input: {
          jarId: testJar.id,
          userId: creatorUser.id,
          userBank: 'mtn',
          userAccountNumber: '0000000001',
          userAccountHolder: 'Payout Creator',
        },
      })

      expect(result.output.success).toBe(false)
      expect(result.output.message).toBe('Jar is frozen')
    })

    it('should return error when user is not the jar creator', async () => {
      await createSettledContribution(testJar.id, 500)

      const { processPayoutTask } = await import('../../src/tasks/process-payout')

      const result = await processPayoutTask.handler({
        req: { payload },
        input: {
          jarId: testJar.id,
          userId: otherUser.id,
          userBank: 'mtn',
          userAccountNumber: '0000000002',
          userAccountHolder: 'Other User',
        },
      })

      expect(result.output.success).toBe(false)
      expect(result.output.message).toBe('Not the jar creator')
    })

    it('should return error when balance is zero', async () => {
      const { processPayoutTask } = await import('../../src/tasks/process-payout')

      const result = await processPayoutTask.handler({
        req: { payload },
        input: {
          jarId: testJar.id,
          userId: creatorUser.id,
          userBank: 'mtn',
          userAccountNumber: '0000000001',
          userAccountHolder: 'Payout Creator',
        },
      })

      expect(result.output.success).toBe(false)
      expect(result.output.message).toBe('No balance available for payout')
    })

    it('should return error for unsupported provider', async () => {
      await createSettledContribution(testJar.id, 500)

      const { processPayoutTask } = await import('../../src/tasks/process-payout')

      const result = await processPayoutTask.handler({
        req: { payload },
        input: {
          jarId: testJar.id,
          userId: creatorUser.id,
          userBank: 'vodafone',
          userAccountNumber: '0000000001',
          userAccountHolder: 'Payout Creator',
        },
      })

      expect(result.output.success).toBe(false)
      expect(result.output.message).toBe('Unsupported mobile money provider')
    })
  })
})
