import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach } from 'vitest'

import config from '@/payload.config'
import { clearAllCollections } from 'tests/utils/testCleanup'

let payload: Payload

describe('Jars Collection Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await clearAllCollections(payload) // Clear collections before tests
  })

  let testUser: any
  let secondUser: any

  beforeEach(async () => {
    // Clean up existing data
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
        email: `jar-creator-${Date.now()}-${Math.random()}@example.com`,
        password: 'password123',
        fullName: 'Jar Creator',
        phoneNumber: '+233541234567',
        country: 'gh' as const,
        isKYCVerified: true,
      },
    })

    secondUser = await payload.create({
      collection: 'users',
      data: {
        email: `jar-collector-${Date.now()}-${Math.random()}@example.com`,
        password: 'password123',
        fullName: 'Jar Collector',
        phoneNumber: '+233541234568',
        country: 'gh' as const,
        isKYCVerified: true,
      },
    })
  })

  describe('Jar Creation', () => {
    it('should create a jar with required fields', async () => {
      const jarData = {
        name: 'Test Savings Jar',
        description: 'A test jar for savings',
        isActive: true,
        isFixedContribution: false,
        goalAmount: 1000,
        currency: 'ghc' as const,
        creator: testUser.id,
        acceptedPaymentMethods: ['mobile-money', 'bank-transfer'] as (
          | 'mobile-money'
          | 'bank-transfer'
          | 'cash'
        )[],
      }

      const jar = await payload.create({
        collection: 'jars',
        data: jarData,
      })

      expect(jar).toBeDefined()
      expect(jar.name).toBe(jarData.name)
      expect(jar.description).toBe(jarData.description)
      expect(jar.isActive).toBe(true)
      expect(jar.isFixedContribution).toBe(false)
      expect(jar.goalAmount).toBe(1000)
      expect(jar.currency).toBe('ghc')
      expect(typeof jar.creator === 'object' ? jar.creator.id : jar.creator).toBe(testUser.id)
      expect(jar.acceptedPaymentMethods).toEqual(['mobile-money', 'bank-transfer'])
    })

    it('should create a jar with fixed contribution amount', async () => {
      const jarData = {
        name: 'Fixed Contribution Jar',
        isFixedContribution: true,
        acceptedContributionAmount: 50,
        currency: 'ngn' as const,
        creator: testUser.id,
        acceptedPaymentMethods: ['mobile-money'] as ('mobile-money' | 'bank-transfer' | 'cash')[],
      }

      const jar = await payload.create({
        collection: 'jars',
        data: jarData,
      })

      expect(jar.isFixedContribution).toBe(true)
      expect(jar.acceptedContributionAmount).toBe(50)
      expect(jar.currency).toBe('ngn')
    })

    it('should create a jar with invitedCollectors', async () => {
      const jarData = {
        name: 'Jar with Invited Collectors',
        currency: 'ghc' as const,
        creator: testUser.id,
        invitedCollectors: [
          {
            collector: secondUser.id,
            status: 'accepted' as const,
          },
        ],
        acceptedPaymentMethods: ['mobile-money'] as ('mobile-money' | 'bank-transfer' | 'cash')[],
      }

      const jar = await payload.create({
        collection: 'jars',
        data: jarData,
      })

      expect(
        jar.invitedCollectors?.map((ic: any) =>
          typeof ic.collector === 'object' ? ic.collector.id : ic.collector,
        ),
      ).toEqual([secondUser.id])
    })

    it('should create a jar with anonymous contributions enabled', async () => {
      const jarData = {
        name: 'Anonymous Jar',
        currency: 'ghc' as const,
        creator: testUser.id,
        acceptAnonymousContributions: true,
        acceptedPaymentMethods: ['cash'] as ('mobile-money' | 'bank-transfer' | 'cash')[],
      }

      const jar = await payload.create({
        collection: 'jars',
        data: jarData,
      })

      expect(jar.acceptAnonymousContributions).toBe(true)
    })

    it('should fail to create jar without required fields', async () => {
      const incompleteJarData = {
        name: 'Incomplete Jar',
        // Missing currency, creator, acceptedPaymentMethods
      } as any

      await expect(
        payload.create({
          collection: 'jars',
          data: incompleteJarData,
        }),
      ).rejects.toThrow()
    })

    it('should fail to create jar with invalid currency', async () => {
      const jarData = {
        name: 'Invalid Currency Jar',
        currency: 'invalid' as any,
        creator: testUser.id,
        acceptedPaymentMethods: ['mobile-money'] as ('mobile-money' | 'bank-transfer' | 'cash')[],
      }

      await expect(
        payload.create({
          collection: 'jars',
          data: jarData,
        }),
      ).rejects.toThrow()
    })
  })

  describe('Jar Retrieval', () => {
    beforeEach(async () => {
      // Create test jars
      const jarsData = [
        {
          name: 'Active Savings Jar',
          currency: 'ghc' as const,
          creator: testUser.id,
          isActive: true,
          goalAmount: 1000,
          acceptedPaymentMethods: ['mobile-money'] as ('mobile-money' | 'bank-transfer' | 'cash')[],
        },
        {
          name: 'Inactive Investment Jar',
          currency: 'ngn' as const,
          creator: testUser.id,
          isActive: false,
          goalAmount: 2000,
          acceptedPaymentMethods: ['bank-transfer'] as (
            | 'mobile-money'
            | 'bank-transfer'
            | 'cash'
          )[],
        },
        {
          name: 'Emergency Fund',
          currency: 'ghc' as const,
          creator: secondUser.id,
          isActive: true,
          isFixedContribution: true,
          acceptedContributionAmount: 100,
          acceptedPaymentMethods: ['mobile-money', 'cash'] as (
            | 'mobile-money'
            | 'bank-transfer'
            | 'cash'
          )[],
        },
      ]

      for (const jarData of jarsData) {
        await payload.create({
          collection: 'jars',
          data: jarData,
        })
      }
    })

    it('should find all jars', async () => {
      const result = await payload.find({
        collection: 'jars',
      })

      expect(result.docs).toHaveLength(3)
      expect(result.totalDocs).toBe(3)
    })

    it('should find jars by currency', async () => {
      const ghcJars = await payload.find({
        collection: 'jars',
        where: {
          currency: {
            equals: 'ghc',
          },
        },
      })

      expect(ghcJars.docs).toHaveLength(2)
      ghcJars.docs.forEach(jar => {
        expect(jar.currency).toBe('ghc')
      })
    })

    it('should find active jars only', async () => {
      const activeJars = await payload.find({
        collection: 'jars',
        where: {
          isActive: {
            equals: true,
          },
        },
      })

      expect(activeJars.docs).toHaveLength(2)
      activeJars.docs.forEach(jar => {
        expect(jar.isActive).toBe(true)
      })
    })

    it('should find jars by creator', async () => {
      const userJars = await payload.find({
        collection: 'jars',
        where: {
          creator: {
            equals: testUser.id,
          },
        },
      })

      expect(userJars.docs).toHaveLength(2)
      userJars.docs.forEach(jar => {
        expect(typeof jar.creator === 'object' ? jar.creator.id : jar.creator).toBe(testUser.id)
      })
    })

    it('should find fixed contribution jars', async () => {
      const fixedJars = await payload.find({
        collection: 'jars',
        where: {
          isFixedContribution: {
            equals: true,
          },
        },
      })

      expect(fixedJars.docs).toHaveLength(1)
      expect(fixedJars.docs[0].isFixedContribution).toBe(true)
      expect(fixedJars.docs[0].acceptedContributionAmount).toBe(100)
    })

    it('should search jars by name', async () => {
      const searchResult = await payload.find({
        collection: 'jars',
        where: {
          name: {
            contains: 'Savings',
          },
        },
      })

      expect(searchResult.docs).toHaveLength(1)
      expect(searchResult.docs[0].name).toBe('Active Savings Jar')
    })
  })

  describe('Jar Updates', () => {
    let testJar: any

    beforeEach(async () => {
      testJar = await payload.create({
        collection: 'jars',
        data: {
          name: 'Update Test Jar',
          currency: 'ghc' as const,
          creator: testUser.id,
          isActive: true,
          goalAmount: 500,
          acceptedPaymentMethods: ['mobile-money'] as ('mobile-money' | 'bank-transfer' | 'cash')[],
        },
      })
    })

    it('should update jar name and description', async () => {
      const updatedJar = await payload.update({
        collection: 'jars',
        id: testJar.id,
        data: {
          name: 'Updated Jar Name',
          description: 'Updated description',
        },
      })

      expect(updatedJar.name).toBe('Updated Jar Name')
      expect(updatedJar.description).toBe('Updated description')
    })

    it('should update jar goal amount', async () => {
      const updatedJar = await payload.update({
        collection: 'jars',
        id: testJar.id,
        data: {
          goalAmount: 1500,
        },
      })

      expect(updatedJar.goalAmount).toBe(1500)
    })

    it('should deactivate jar', async () => {
      const updatedJar = await payload.update({
        collection: 'jars',
        id: testJar.id,
        data: {
          isActive: false,
        },
      })

      expect(updatedJar.isActive).toBe(false)
    })

    it('should add invitedCollectors to jar', async () => {
      const updatedJar = await payload.update({
        collection: 'jars',
        id: testJar.id,
        data: {
          invitedCollectors: [
            {
              collector: secondUser.id,
              status: 'accepted' as const,
            },
          ],
        },
      })

      expect(
        updatedJar.invitedCollectors?.map((ic: any) =>
          typeof ic.collector === 'object' ? ic.collector.id : ic.collector,
        ),
      ).toEqual([secondUser.id])
    })

    it('should update payment methods', async () => {
      const updatedJar = await payload.update({
        collection: 'jars',
        id: testJar.id,
        data: {
          acceptedPaymentMethods: ['mobile-money', 'bank-transfer', 'cash'],
        },
      })

      expect(updatedJar.acceptedPaymentMethods).toEqual(['mobile-money', 'bank-transfer', 'cash'])
    })
  })

  describe('Jar Deletion', () => {
    let testJar: any

    beforeEach(async () => {
      testJar = await payload.create({
        collection: 'jars',
        data: {
          name: 'Delete Test Jar',
          currency: 'ghc' as const,
          creator: testUser.id,
          acceptedPaymentMethods: ['mobile-money'] as ('mobile-money' | 'bank-transfer' | 'cash')[],
        },
      })
    })

    it('should delete a jar', async () => {
      const deletedJar = await payload.delete({
        collection: 'jars',
        id: testJar.id,
      })

      expect(deletedJar.id).toBe(testJar.id)

      // Verify jar is deleted
      await expect(
        payload.findByID({
          collection: 'jars',
          id: testJar.id,
        }),
      ).rejects.toThrow()
    })

    it('should fail to delete non-existent jar', async () => {
      const fakeId = '507f1f77bcf86cd799439011'

      await expect(
        payload.delete({
          collection: 'jars',
          id: fakeId,
        }),
      ).rejects.toThrow()
    })
  })

  describe('Complex Jar Queries', () => {
    beforeEach(async () => {
      // Create diverse test data
      const jarsData = [
        {
          name: 'High Goal Active Jar',
          currency: 'ghc' as const,
          creator: testUser.id,
          isActive: true,
          goalAmount: 5000,
          acceptedPaymentMethods: ['mobile-money'] as ('mobile-money' | 'bank-transfer' | 'cash')[],
        },
        {
          name: 'Low Goal Active Jar',
          currency: 'ghc' as const,
          creator: testUser.id,
          isActive: true,
          goalAmount: 500,
          acceptedPaymentMethods: ['mobile-money'] as ('mobile-money' | 'bank-transfer' | 'cash')[],
        },
        {
          name: 'Inactive Fixed Jar',
          currency: 'ngn' as const,
          creator: secondUser.id,
          isActive: false,
          isFixedContribution: true,
          acceptedContributionAmount: 200,
          acceptedPaymentMethods: ['bank-transfer'] as (
            | 'mobile-money'
            | 'bank-transfer'
            | 'cash'
          )[],
        },
        {
          name: 'Anonymous Contribution Jar',
          currency: 'ghc' as const,
          creator: secondUser.id,
          isActive: true,
          acceptAnonymousContributions: true,
          acceptedPaymentMethods: ['cash'] as ('mobile-money' | 'bank-transfer' | 'cash')[],
        },
      ]

      for (const jarData of jarsData) {
        await payload.create({
          collection: 'jars',
          data: jarData,
        })
      }
    })

    it('should find active jars with high goals', async () => {
      const result = await payload.find({
        collection: 'jars',
        where: {
          and: [
            {
              isActive: {
                equals: true,
              },
            },
            {
              goalAmount: {
                greater_than: 1000,
              },
            },
          ],
        },
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0].name).toBe('High Goal Active Jar')
      expect(result.docs[0].goalAmount).toBe(5000)
    })

    it('should find jars that accept anonymous contributions', async () => {
      const result = await payload.find({
        collection: 'jars',
        where: {
          acceptAnonymousContributions: {
            equals: true,
          },
        },
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0].acceptAnonymousContributions).toBe(true)
    })

    it('should paginate jar results', async () => {
      const page1 = await payload.find({
        collection: 'jars',
        limit: 2,
        page: 1,
        sort: 'name',
      })

      const page2 = await payload.find({
        collection: 'jars',
        limit: 2,
        page: 2,
        sort: 'name',
      })

      expect(page1.docs).toHaveLength(2)
      expect(page2.docs).toHaveLength(2)
      expect(page1.docs[0].id).not.toBe(page2.docs[0].id)
      expect(page1.page).toBe(1)
      expect(page2.page).toBe(2)
      expect(page1.totalPages).toBe(2)
    })

    it('should find jars by currency and payment method', async () => {
      const result = await payload.find({
        collection: 'jars',
        where: {
          and: [
            {
              currency: {
                equals: 'ghc',
              },
            },
            {
              acceptedPaymentMethods: {
                contains: 'mobile-money',
              },
            },
          ],
        },
      })

      expect(result.docs).toHaveLength(2)
      result.docs.forEach(jar => {
        expect(jar.currency).toBe('ghc')
        expect(jar.acceptedPaymentMethods).toContain('mobile-money')
      })
    })
  })
})
