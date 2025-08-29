import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach } from 'vitest'

import config from '@/payload.config'
import { clearAllCollections } from 'tests/utils/testCleanup'

let payload: Payload

describe('Contributions Collection Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await clearAllCollections(payload) // Clear collections before tests
  })

  let testUser: any
  let collectorUser: any
  let testJar: any

  beforeEach(async () => {
    // Clean up existing data
    const contributions = await payload.find({ collection: 'contributions' })
    for (const contribution of contributions.docs) {
      await payload.delete({ collection: 'contributions', id: contribution.id })
    }

    const jars = await payload.find({ collection: 'jars' })
    for (const jar of jars.docs) {
      await payload.delete({ collection: 'jars', id: jar.id })
    }

    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          not_equals: 'admin@test.com',
        },
      },
    })
    for (const user of users.docs) {
      await payload.delete({ collection: 'users', id: user.id })
    }

    // Create test users
    testUser = await payload.create({
      collection: 'users',
      data: {
        email: `contrib-creator-${Date.now()}-${Math.random()}@example.com`,
        password: 'password123',
        fullName: 'Jar Creator',
        phoneNumber: '+233541234567',
        country: 'gh' as const,
        isKYCVerified: true,
      },
    })

    collectorUser = await payload.create({
      collection: 'users',
      data: {
        email: `contrib-collector-${Date.now()}-${Math.random()}@example.com`,
        password: 'password123',
        fullName: 'Jar Collector',
        phoneNumber: '+233541234568',
        country: 'gh' as const,
        isKYCVerified: true,
      },
    })

    // Create test jar
    testJar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Test Contribution Jar',
        status: 'open',
        currency: 'ghc' as const,
        creator: testUser.id,
        invitedCollectors: [
          {
            collector: collectorUser.id,
            status: 'accepted' as const,
          },
        ],
        isActive: true,
        acceptedPaymentMethods: ['mobile-money', 'bank-transfer'] as (
          | 'mobile-money'
          | 'bank-transfer'
          | 'cash'
        )[],
      },
    })
  })

  describe('Contribution Creation', () => {
    it('should create a contribution with required fields', async () => {
      const contributionData = {
        jar: testJar.id,
        contributor: 'John Doe',
        contributorPhoneNumber: '+233541234569',
        paymentMethod: 'mobile-money' as const,
        mobileMoneyProvider: 'mtn' as const,
        amountContributed: 100,
        collector: collectorUser.id,
        viaPaymentLink: false,
        type: 'contribution' as const,
      }

      const contribution = await payload.create({
        collection: 'contributions',
        data: contributionData,
      })

      expect(contribution).toBeDefined()
      expect(typeof contribution.jar === 'object' ? contribution.jar.id : contribution.jar).toBe(
        testJar.id,
      )
      expect(contribution.contributor).toBe('John Doe')
      expect(contribution.contributorPhoneNumber).toBe('+233541234569')
      expect(contribution.paymentMethod).toBe('mobile-money')
      expect(contribution.amountContributed).toBe(100)
      expect(
        typeof contribution.collector === 'object'
          ? contribution.collector.id
          : contribution.collector,
      ).toBe(collectorUser.id)
      expect(contribution.paymentStatus).toBe('pending') // Default value
      expect(contribution.viaPaymentLink).toBe(false)
    })

    it('should create an anonymous contribution', async () => {
      const contributionData = {
        jar: testJar.id,
        contributorPhoneNumber: '+233541234570',
        paymentMethod: 'cash' as const,
        amountContributed: 50,
        collector: testUser.id,
        type: 'contribution' as const,
      }

      const contribution = await payload.create({
        collection: 'contributions',
        data: contributionData,
      })

      expect(contribution.contributor).toBeUndefined()
      expect(contribution.contributorPhoneNumber).toBe('+233541234570')
      expect(contribution.paymentMethod).toBe('cash')
      expect(contribution.amountContributed).toBe(50)
    })

    it('should create a contribution via payment link', async () => {
      const contributionData = {
        jar: testJar.id,
        contributor: 'Jane Smith',
        contributorPhoneNumber: '+233541234571',
        paymentMethod: 'bank-transfer' as const,
        accountNumber: '1234567890',
        amountContributed: 200,
        collector: collectorUser.id,
        viaPaymentLink: true,
        type: 'contribution' as const,
      }

      const contribution = await payload.create({
        collection: 'contributions',
        data: contributionData,
      })

      expect(contribution.viaPaymentLink).toBe(true)
      expect(contribution.paymentMethod).toBe('bank-transfer')
      expect(contribution.amountContributed).toBe(200)
    })

    it('should fail to create contribution without required fields', async () => {
      const incompleteContributionData = {
        jar: testJar.id,
        contributorPhoneNumber: '+233541234572',
        // Missing amountContributed, collector
      } as any

      await expect(
        payload.create({
          collection: 'contributions',
          data: incompleteContributionData,
        }),
      ).rejects.toThrow()
    })

    it('should fail to create contribution with invalid payment method', async () => {
      const contributionData = {
        jar: testJar.id,
        contributorPhoneNumber: '+233541234573',
        paymentMethod: 'invalid-method' as any,
        amountContributed: 100,
        collector: collectorUser.id,
        type: 'contribution' as const,
      }

      await expect(
        payload.create({
          collection: 'contributions',
          data: contributionData,
        }),
      ).rejects.toThrow()
    })
  })

  describe('Contribution Retrieval', () => {
    beforeEach(async () => {
      // Create test contributions
      const contributionsData = [
        {
          jar: testJar.id,
          contributor: 'Alice Johnson',
          contributorPhoneNumber: '+233541111111',
          paymentMethod: 'mobile-money' as const,
          mobileMoneyProvider: 'mtn' as const,
          amountContributed: 150,
          collector: collectorUser.id,
          viaPaymentLink: false,
          type: 'contribution' as const,
        },
        {
          jar: testJar.id,
          contributor: 'Bob Wilson',
          contributorPhoneNumber: '+233541222222',
          paymentMethod: 'bank-transfer' as const,
          accountNumber: '9876543210',
          amountContributed: 250,
          collector: testUser.id,
          viaPaymentLink: true,
          type: 'contribution' as const,
        },
        {
          jar: testJar.id,
          contributorPhoneNumber: '+233541333333',
          paymentMethod: 'cash' as const,
          amountContributed: 75,
          collector: collectorUser.id,
          viaPaymentLink: false,
          type: 'contribution' as const,
        },
      ]

      for (const contributionData of contributionsData) {
        await payload.create({
          collection: 'contributions',
          data: contributionData,
        })
      }
    })

    it('should find all contributions', async () => {
      const result = await payload.find({
        collection: 'contributions',
      })

      expect(result.docs).toHaveLength(3)
      expect(result.totalDocs).toBe(3)
    })

    it('should find contributions by jar', async () => {
      const jarContributions = await payload.find({
        collection: 'contributions',
        where: {
          jar: {
            equals: testJar.id,
          },
        },
      })

      expect(jarContributions.docs).toHaveLength(3)
      jarContributions.docs.forEach(contribution => {
        expect(typeof contribution.jar === 'object' ? contribution.jar.id : contribution.jar).toBe(
          testJar.id,
        )
      })
    })

    it('should find contributions by payment method', async () => {
      const mobileMoneyContributions = await payload.find({
        collection: 'contributions',
        where: {
          paymentMethod: {
            equals: 'mobile-money',
          },
        },
      })

      expect(mobileMoneyContributions.docs).toHaveLength(1)
      expect(mobileMoneyContributions.docs[0].paymentMethod).toBe('mobile-money')
    })

    it('should find contributions by collector', async () => {
      const collectorContributions = await payload.find({
        collection: 'contributions',
        where: {
          collector: {
            equals: collectorUser.id,
          },
        },
      })

      expect(collectorContributions.docs).toHaveLength(2)
      collectorContributions.docs.forEach(contribution => {
        expect(
          typeof contribution.collector === 'object'
            ? contribution.collector.id
            : contribution.collector,
        ).toBe(collectorUser.id)
      })
    })

    it('should find contributions by amount range', async () => {
      const highValueContributions = await payload.find({
        collection: 'contributions',
        where: {
          amountContributed: {
            greater_than: 100,
          },
        },
      })

      expect(highValueContributions.docs).toHaveLength(2)
      highValueContributions.docs.forEach(contribution => {
        expect(contribution.amountContributed).toBeGreaterThan(100)
      })
    })

    it('should find contributions via payment link', async () => {
      const paymentLinkContributions = await payload.find({
        collection: 'contributions',
        where: {
          viaPaymentLink: {
            equals: true,
          },
        },
      })

      expect(paymentLinkContributions.docs).toHaveLength(1)
      expect(paymentLinkContributions.docs[0].viaPaymentLink).toBe(true)
    })

    it('should find anonymous contributions', async () => {
      const anonymousContributions = await payload.find({
        collection: 'contributions',
        where: {
          contributor: {
            equals: null,
          },
        },
      })

      expect(anonymousContributions.docs).toHaveLength(1)
      expect(anonymousContributions.docs[0].contributor).toBeUndefined()
    })
  })

  describe('Contribution Updates', () => {
    let testContribution: any

    beforeEach(async () => {
      testContribution = await payload.create({
        collection: 'contributions',
        data: {
          jar: testJar.id,
          contributor: 'Update Test User',
          contributorPhoneNumber: '+233541234574',
          paymentMethod: 'mobile-money' as const,
          mobileMoneyProvider: 'mtn' as const,
          amountContributed: 120,
          collector: collectorUser.id,
          viaPaymentLink: false,
          type: 'contribution' as const,
        },
      })
    })

    it('should update contribution payment status', async () => {
      const updatedContribution = await payload.update({
        collection: 'contributions',
        id: testContribution.id,
        data: {
          paymentStatus: 'completed',
        },
      })

      expect(updatedContribution.paymentStatus).toBe('completed')
    })

    it('should update contribution amount', async () => {
      const updatedContribution = await payload.update({
        collection: 'contributions',
        id: testContribution.id,
        data: {
          amountContributed: 180,
        },
      })

      expect(updatedContribution.amountContributed).toBe(180)
    })

    it('should update payment method', async () => {
      const updatedContribution = await payload.update({
        collection: 'contributions',
        id: testContribution.id,
        data: {
          paymentMethod: 'bank-transfer',
          accountNumber: '5555555555',
        },
      })

      expect(updatedContribution.paymentMethod).toBe('bank-transfer')
    })

    it('should update contributor information', async () => {
      const updatedContribution = await payload.update({
        collection: 'contributions',
        id: testContribution.id,
        data: {
          contributor: 'Updated Contributor Name',
          contributorPhoneNumber: '+233541234575',
        },
      })

      expect(updatedContribution.contributor).toBe('Updated Contributor Name')
      expect(updatedContribution.contributorPhoneNumber).toBe('+233541234575')
    })

    it('should fail to update with invalid payment status', async () => {
      await expect(
        payload.update({
          collection: 'contributions',
          id: testContribution.id,
          data: {
            paymentStatus: 'invalid-status' as any,
          },
        }),
      ).rejects.toThrow()
    })
  })

  describe('Contribution Deletion', () => {
    let testContribution: any

    beforeEach(async () => {
      testContribution = await payload.create({
        collection: 'contributions',
        data: {
          jar: testJar.id,
          contributor: 'Delete Test User',
          contributorPhoneNumber: '+233541234576',
          paymentMethod: 'cash' as const,
          amountContributed: 90,
          collector: testUser.id,
          type: 'contribution' as const,
        },
      })
    })

    it('should delete a contribution', async () => {
      const deletedContribution = await payload.delete({
        collection: 'contributions',
        id: testContribution.id,
      })

      expect(deletedContribution.id).toBe(testContribution.id)

      // Verify contribution is deleted
      await expect(
        payload.findByID({
          collection: 'contributions',
          id: testContribution.id,
        }),
      ).rejects.toThrow()
    })

    it('should fail to delete non-existent contribution', async () => {
      const fakeId = '507f1f77bcf86cd799439011'

      await expect(
        payload.delete({
          collection: 'contributions',
          id: fakeId,
        }),
      ).rejects.toThrow()
    })
  })

  describe('Complex Contribution Queries', () => {
    beforeEach(async () => {
      // Create diverse test data
      const contributionsData = [
        {
          jar: testJar.id,
          contributor: 'High Value Contributor',
          contributorPhoneNumber: '+233541111111',
          paymentMethod: 'mobile-money' as const,
          mobileMoneyProvider: 'mtn' as const,
          amountContributed: 500,
          collector: collectorUser.id,
          viaPaymentLink: true,
          type: 'contribution' as const,
        },
        {
          jar: testJar.id,
          contributor: 'Medium Value Contributor',
          contributorPhoneNumber: '+233541222222',
          paymentMethod: 'bank-transfer' as const,
          accountNumber: '1111111111',
          amountContributed: 200,
          collector: testUser.id,
          viaPaymentLink: false,
          type: 'contribution' as const,
        },
        {
          jar: testJar.id,
          contributorPhoneNumber: '+233541333333',
          paymentMethod: 'cash' as const,
          amountContributed: 50,
          collector: collectorUser.id,
          viaPaymentLink: false,
          type: 'contribution' as const,
        },
        {
          jar: testJar.id,
          contributor: 'Bank Transfer User',
          contributorPhoneNumber: '+233541444444',
          paymentMethod: 'bank-transfer' as const,
          accountNumber: '2222222222',
          amountContributed: 300,
          collector: testUser.id,
          viaPaymentLink: true,
          type: 'contribution' as const,
        },
      ]

      for (const contributionData of contributionsData) {
        await payload.create({
          collection: 'contributions',
          data: contributionData,
        })
      }
    })

    it('should find high value contributions via payment link', async () => {
      const result = await payload.find({
        collection: 'contributions',
        where: {
          and: [
            {
              amountContributed: {
                greater_than: 250,
              },
            },
            {
              viaPaymentLink: {
                equals: true,
              },
            },
          ],
        },
      })

      expect(result.docs).toHaveLength(2)
      result.docs.forEach(contribution => {
        expect(contribution.amountContributed).toBeGreaterThan(250)
        expect(contribution.viaPaymentLink).toBe(true)
      })
    })

    it('should find bank transfer contributions', async () => {
      const result = await payload.find({
        collection: 'contributions',
        where: {
          paymentMethod: {
            equals: 'bank-transfer',
          },
        },
        sort: '-amountContributed',
      })

      expect(result.docs).toHaveLength(2)
      expect(result.docs[0].amountContributed).toBe(300)
      expect(result.docs[1].amountContributed).toBe(200)
    })

    it('should calculate total contributions for jar', async () => {
      const jarContributions = await payload.find({
        collection: 'contributions',
        where: {
          jar: {
            equals: testJar.id,
          },
        },
      })

      const totalAmount = jarContributions.docs.reduce(
        (sum, contribution) => sum + contribution.amountContributed,
        0,
      )

      expect(totalAmount).toBe(1050) // 500 + 200 + 50 + 300
      expect(jarContributions.docs).toHaveLength(4)
    })

    it('should find contributions by collector with pagination', async () => {
      const page1 = await payload.find({
        collection: 'contributions',
        where: {
          collector: {
            equals: collectorUser.id,
          },
        },
        limit: 1,
        page: 1,
        sort: '-amountContributed',
      })

      const page2 = await payload.find({
        collection: 'contributions',
        where: {
          collector: {
            equals: collectorUser.id,
          },
        },
        limit: 1,
        page: 2,
        sort: '-amountContributed',
      })

      expect(page1.docs).toHaveLength(1)
      expect(page2.docs).toHaveLength(1)
      expect(page1.docs[0].amountContributed).toBe(500) // Highest amount first
      expect(page2.docs[0].amountContributed).toBe(50) // Lowest amount second
      expect(page1.page).toBe(1)
      expect(page2.page).toBe(2)
    })

    it('should find non-anonymous contributions only', async () => {
      const result = await payload.find({
        collection: 'contributions',
        where: {
          contributor: {
            not_equals: null,
          },
        },
      })

      expect(result.docs).toHaveLength(3)
      result.docs.forEach(contribution => {
        expect(contribution.contributor).toBeDefined()
        expect(contribution.contributor).not.toBeNull()
      })
    })
  })
})
