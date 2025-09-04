import { getPayload, Payload } from 'payload'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

import { getJarSummary } from '../../src/collections/Jars/endpoints/get-jar-summary'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'

let payload: Payload

describe('Get Jar Summary Endpoint Integration Tests', () => {
  let testUser: any
  let testJar: any
  let testContributions: any[] = []

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await clearAllCollections(payload)

    // Create a test user for authentication
    testUser = await payload.create({
      collection: 'users',
      data: {
        email: 'jar-summary-test@example.com',
        password: 'testpassword123',
        fullName: 'Jar Summary Test User',
        phoneNumber: '+1234567890',
        countryCode: '+1',
        country: 'us',
        isKYCVerified: true,
      },
    })
  })

  beforeEach(async () => {
    // Create a test jar
    testJar = await payload.create({
      collection: 'jars',
      data: {
        status: 'open',
        name: 'Test Jar for Summary',
        description: 'A test jar for summary endpoint testing',
        goalAmount: 1000,
        acceptedContributionAmount: 100,
        currency: 'ghc',
        isActive: true,
        isFixedContribution: false,
        creator: testUser.id,
        acceptedPaymentMethods: ['mobile-money', 'bank-transfer'],
        acceptAnonymousContributions: false,
      },
    })

    // Create test contributions
    const contributionData = [
      { amountContributed: 100, contributorPhoneNumber: '+1234567890' },
      { amountContributed: 75, contributorPhoneNumber: '+1234567891' },
      { amountContributed: 50, contributorPhoneNumber: '+1234567892' },
      { amountContributed: 25, contributorPhoneNumber: '+1234567893' },
    ]

    testContributions = []
    for (const contrib of contributionData) {
      const contribution = await payload.create({
        collection: 'contributions',
        data: {
          ...contrib,
          jar: testJar.id,
          contributor: 'Test Contributor',
          paymentMethod: 'mobile-money',
          mobileMoneyProvider: 'mtn',
          paymentStatus: 'completed',
          collector: testUser.id,
          type: 'contribution' as const,
        },
      })
      testContributions.push(contribution)
    }
  })

  afterAll(async () => {
    await clearAllCollections(payload)
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      const mockRequest = {
        payload,
        user: null, // No authenticated user
        routeParams: {
          id: 'some-jar-id',
        },
      } as any

      const response = await getJarSummary(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Unauthorized')
    })
  })

  describe('Input Validation', () => {
    it('should return 200 when jarId is missing', async () => {
      const mockRequest = {
        payload,
        user: testUser,
        routeParams: {}, // No id parameter
      } as any

      const response = await getJarSummary(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toBe('Jar summary retrieved successfully')
    })

    it('should return user jar when jarId is null string', async () => {
      const mockRequest = {
        payload,
        user: testUser,
        routeParams: {
          id: 'null',
        },
      } as any

      const response = await getJarSummary(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should return 200 when jarId is empty string', async () => {
      const mockRequest = {
        payload,
        user: testUser,
        routeParams: {
          id: '',
        },
      } as any

      const response = await getJarSummary(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toBe('Jar summary retrieved successfully')
    })
  })

  describe('Jar Retrieval', () => {
    it('should return 200 when jar does not exist', async () => {
      const nonExistentJarId = '507f1f77bcf86cd799439011' // Valid ObjectId format

      const mockRequest = {
        payload,
        user: testUser,
        routeParams: {
          id: nonExistentJarId,
        },
      } as any

      const response = await getJarSummary(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toBe('Jar summary retrieved successfully')
    })

    it('should return jar summary with contributions when jar exists', async () => {
      const mockRequest = {
        payload,
        user: testUser,
        routeParams: {
          id: testJar.id,
        },
      } as any

      const response = await getJarSummary(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Verify jar data is included
      expect(result.data.id).toBe(testJar.id)
      expect(result.data.name).toBe('Test Jar for Summary')
      expect(result.data.description).toBe('A test jar for summary endpoint testing')
      expect(result.data.goalAmount).toBe(1000)
      expect(result.data.acceptedContributionAmount).toBe(100)
      expect(result.data.currency).toBe('ghc')
      expect(result.data.isActive).toBe(true)
      expect(result.data.isFixedContribution).toBe(false)

      // Verify contributions are included
      expect(result.data.contributions).toBeDefined()
      expect(result.data.contributions.docs).toBeInstanceOf(Array)
      expect(result.data.contributions.totalDocs).toBe(testContributions.length)

      // Verify contribution structure
      const contributions = result.data.contributions.docs
      expect(contributions.length).toBeGreaterThan(0)

      const firstContribution = contributions[0]
      expect(firstContribution).toHaveProperty('amountContributed')
      expect(firstContribution).toHaveProperty('contributorPhoneNumber')
      expect(firstContribution).toHaveProperty('jar')
      expect(firstContribution).toHaveProperty('contributor')
      expect(firstContribution).toHaveProperty('paymentMethod')
      expect(firstContribution).toHaveProperty('paymentStatus')
      expect(firstContribution).toHaveProperty('collector')
    })

    it('should limit contributions to 10 items', async () => {
      // Create more than 10 contributions
      const extraContributions = []
      for (let i = 0; i < 12; i++) {
        const contribution = await payload.create({
          collection: 'contributions',
          data: {
            amountContributed: 10 + i,
            contributorPhoneNumber: `+1234567${890 + i}`,
            jar: testJar.id,
            contributor: `Extra Contributor ${i + 1}`,
            paymentMethod: 'mobile-money',
            mobileMoneyProvider: 'mtn',
            paymentStatus: 'completed',
            collector: testUser.id,
            type: 'contribution' as const,
          },
        })
        extraContributions.push(contribution)
      }

      const mockRequest = {
        payload,
        user: testUser,
        routeParams: {
          id: testJar.id,
        },
      } as any

      const response = await getJarSummary(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.contributions.docs.length).toBeLessThanOrEqual(10)

      // Clean up extra contributions
      for (const contrib of extraContributions) {
        await payload.delete({
          collection: 'contributions',
          id: contrib.id,
        })
      }
    })

    it('should include jar with depth 2 relationships', async () => {
      const mockRequest = {
        payload,
        user: testUser,
        routeParams: {
          id: testJar.id,
        },
      } as any

      const response = await getJarSummary(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)

      // Verify that relationships are populated (depth 2)
      expect(result.data.creator).toBeTypeOf('object')
      expect(result.data.creator.id).toBe(testUser.id)
      expect(result.data.creator.email).toBe(testUser.email)

      // Verify invitedCollectors are populated (if any)
      if (result.data.invitedCollectors && result.data.invitedCollectors.length > 0) {
        expect(result.data.invitedCollectors).toBeInstanceOf(Array)
        expect(result.data.invitedCollectors[0]).toBeTypeOf('object')
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle jar with no contributions', async () => {
      // Create a jar without contributions
      const emptyJar = await payload.create({
        collection: 'jars',
        data: {
          status: 'open',
          name: 'Empty Test Jar',
          description: 'A jar with no contributions',
          goalAmount: 500,
          acceptedContributionAmount: 50,
          currency: 'ghc',
          isActive: true,
          isFixedContribution: false,
          creator: testUser.id,
          acceptedPaymentMethods: ['mobile-money'],
          acceptAnonymousContributions: false,
        },
      })

      const mockRequest = {
        payload,
        user: testUser,
        routeParams: {
          id: emptyJar.id,
        },
      } as any

      const response = await getJarSummary(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.contributions.docs).toEqual([])
      expect(result.data.contributions.totalDocs).toBe(0)

      // Clean up
      await payload.delete({
        collection: 'jars',
        id: emptyJar.id,
      })
    })

    it('should handle invalid jar ID format gracefully', async () => {
      const mockRequest = {
        payload,
        user: testUser,
        routeParams: {
          id: 'invalid-id-format',
        },
      } as any

      const response = await getJarSummary(mockRequest)
      const result = await response.json()

      // Should return 200 since the jar won't be found with invalid ID
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toBe('Jar summary retrieved successfully')
    })
  })

  describe('Response Structure', () => {
    it('should return properly structured response', async () => {
      const mockRequest = {
        payload,
        user: testUser,
        routeParams: {
          id: testJar.id,
        },
      } as any

      const response = await getJarSummary(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result.success).toBe(true)

      const data = result.data

      // Verify jar properties
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('name')
      expect(data).toHaveProperty('description')
      expect(data).toHaveProperty('goalAmount')
      expect(data).toHaveProperty('acceptedContributionAmount')
      expect(data).toHaveProperty('currency')
      expect(data).toHaveProperty('isActive')
      expect(data).toHaveProperty('isFixedContribution')
      expect(data).toHaveProperty('creator')
      expect(data).toHaveProperty('acceptedPaymentMethods')
      expect(data).toHaveProperty('createdAt')
      expect(data).toHaveProperty('updatedAt')

      // Verify contributions structure
      expect(data).toHaveProperty('contributions')
      expect(data.contributions).toHaveProperty('docs')
      expect(data.contributions).toHaveProperty('totalDocs')
      expect(data.contributions).toHaveProperty('limit')
      expect(data.contributions).toHaveProperty('page')
      expect(data.contributions.limit).toBe(10)
    })
  })
})
