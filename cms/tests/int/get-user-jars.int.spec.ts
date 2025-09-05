import type { PayloadRequest } from 'payload'
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'

import { getUserJars } from '../../src/collections/Jars/endpoints/get-user-jars'

// Mock PayloadRequest
const createMockRequest = (overrides: Partial<PayloadRequest> = {}): PayloadRequest => {
  const baseRequest = {
    user: null,
    payload: {
      find: vi.fn(),
    },
    routeParams: {},
  }

  return { ...baseRequest, ...overrides } as PayloadRequest
}

// Mock user factory
const createMockUser = (id: string = 'user123') => ({
  id,
  fullName: 'Test User',
  phoneNumber: '+1234567890',
  country: 'US',
  email: 'test@example.com',
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  collection: 'users' as const,
})

describe('getUserJars', () => {
  let mockFind: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    mockFind = vi.fn()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = createMockRequest()

      const response = await getUserJars(req)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData).toEqual({
        success: false,
        message: 'Unauthorized',
      })
    })
  })

  describe('Successful jar retrieval', () => {
    it('should return grouped jars when user has jars as creator', async () => {
      const mockUser = createMockUser()
      const mockJarData1 = {
        id: 'jar123',
        name: 'Test Jar 1',
        description: null,
        creator: mockUser,
        invitedCollectors: [],
        jarGroup: { id: 'group1', name: 'Wedding Fund' },
        image: null,
        isActive: true,
        isFixedContribution: false,
        acceptedContributionAmount: null,
        goalAmount: 0,
        deadline: null,
        currency: 'ghc',
        paymentLink: null,
        acceptAnonymousContributions: false,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const mockJarData2 = {
        id: 'jar456',
        name: 'Test Jar 2',
        description: null,
        creator: mockUser,
        invitedCollectors: [],
        jarGroup: { id: 'group1', name: 'Wedding Fund' },
        image: null,
        isActive: true,
        isFixedContribution: false,
        acceptedContributionAmount: null,
        goalAmount: 0,
        deadline: null,
        currency: 'ghc',
        paymentLink: null,
        acceptAnonymousContributions: false,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockFind.mockResolvedValue({
        docs: [mockJarData1, mockJarData2],
      })

      const req = createMockRequest({
        user: mockUser,
        payload: { find: mockFind } as any,
      })

      const response = await getUserJars(req)
      const responseData = await response.json()

      expect(mockFind).toHaveBeenCalledWith({
        collection: 'jars',
        where: {
          or: [
            {
              creator: {
                equals: mockUser,
              },
              status: {
                not_equals: 'broken',
              },
            },
            {
              'invitedCollectors.collector': {
                equals: mockUser,
              },
              status: {
                not_equals: 'broken',
              },
            },
          ],
        },
        depth: 2,
        limit: 1000,
      })

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toHaveLength(1)
      expect(responseData.data[0].id).toBe('group1')
      expect(responseData.data[0].name).toBe('Wedding Fund')
      expect(responseData.data[0].totalJars).toBe(2)
      expect(responseData.data[0].jars).toHaveLength(2)
    })

    it('should return grouped jars when user has jars as collector', async () => {
      const mockUser = createMockUser()
      const mockJarData = {
        id: 'jar789',
        name: 'Collector Jar',
        description: null,
        creator: { id: 'otherUser', name: 'Other User', profilePicture: null },
        invitedCollectors: [
          {
            collector: mockUser,
            status: 'accepted',
          },
        ],
        jarGroup: { id: 'group2', name: 'Vacation Fund' },
        image: null,
        isActive: true,
        isFixedContribution: false,
        acceptedContributionAmount: null,
        goalAmount: 0,
        deadline: null,
        currency: 'ghc',
        paymentLink: null,
        acceptAnonymousContributions: false,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockFind.mockResolvedValue({
        docs: [mockJarData],
      })

      const req = createMockRequest({
        user: mockUser,
        payload: { find: mockFind } as any,
      })

      const response = await getUserJars(req)
      const responseData = await response.json()

      expect(mockFind).toHaveBeenCalledWith({
        collection: 'jars',
        where: {
          or: [
            {
              creator: {
                equals: mockUser,
              },
              status: {
                not_equals: 'broken',
              },
            },
            {
              'invitedCollectors.collector': {
                equals: mockUser,
              },
              status: {
                not_equals: 'broken',
              },
            },
          ],
        },
        depth: 2,
        limit: 1000,
      })

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toHaveLength(1)
      expect(responseData.data[0].id).toBe('group2')
      expect(responseData.data[0].name).toBe('Vacation Fund')
      expect(responseData.data[0].totalJars).toBe(1)
      expect(responseData.data[0].jars).toHaveLength(1)
    })

    it('should return empty array when user has no jars', async () => {
      const mockUser = createMockUser()

      mockFind.mockResolvedValue({
        docs: [],
      })

      const req = createMockRequest({
        user: mockUser,
        payload: { find: mockFind } as any,
      })

      const response = await getUserJars(req)
      const responseData = await response.json()

      expect(mockFind).toHaveBeenCalledWith({
        collection: 'jars',
        where: {
          or: [
            {
              creator: {
                equals: mockUser,
              },
              status: {
                not_equals: 'broken',
              },
            },
            {
              'invitedCollectors.collector': {
                equals: mockUser,
              },
              status: {
                not_equals: 'broken',
              },
            },
          ],
        },
        depth: 2,
        limit: 1000,
      })

      expect(response.status).toBe(200)
      expect(responseData).toEqual({
        success: true,
        data: [],
      })
    })

    it('should handle mixed grouped and ungrouped jars', async () => {
      const mockUser = createMockUser()
      const groupedJar = {
        id: 'jar1',
        name: 'Grouped Jar',
        description: null,
        creator: mockUser,
        invitedCollectors: [],
        jarGroup: { id: 'group1', name: 'Wedding Fund' },
        image: null,
        isActive: true,
        isFixedContribution: false,
        acceptedContributionAmount: null,
        goalAmount: 0,
        deadline: null,
        currency: 'ghc',
        paymentLink: null,
        acceptAnonymousContributions: false,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const ungroupedJar = {
        id: 'jar2',
        name: 'Ungrouped Jar',
        description: null,
        creator: mockUser,
        invitedCollectors: [],
        jarGroup: null,
        image: null,
        isActive: true,
        isFixedContribution: false,
        acceptedContributionAmount: null,
        goalAmount: 0,
        deadline: null,
        currency: 'ghc',
        paymentLink: null,
        acceptAnonymousContributions: false,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockFind.mockResolvedValue({
        docs: [groupedJar, ungroupedJar],
      })

      const req = createMockRequest({
        user: mockUser,
        payload: { find: mockFind } as any,
      })

      const response = await getUserJars(req)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toHaveLength(2)

      // Find the groups in the response
      const groupedGroup = responseData.data.find((group: any) => group.id === 'group1')
      const ungroupedGroup = responseData.data.find((group: any) => group.id === 'ungrouped')

      expect(groupedGroup).toBeDefined()
      expect(groupedGroup.name).toBe('Wedding Fund')
      expect(groupedGroup.totalJars).toBe(1)
      expect(groupedGroup.jars).toHaveLength(1)

      expect(ungroupedGroup).toBeDefined()
      expect(ungroupedGroup.name).toBe('Ungrouped')
      expect(ungroupedGroup.totalJars).toBe(1)
      expect(ungroupedGroup.jars).toHaveLength(1)
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockUser = createMockUser()
      const dbError = new Error('Database connection failed')

      mockFind.mockRejectedValue(dbError)

      const req = createMockRequest({
        user: mockUser,
        payload: { find: mockFind } as any,
      })

      const response = await getUserJars(req)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual({
        success: true,
        message: 'No Jars found',
        error: 'Database connection failed',
      })
    })

    it('should handle payload not found errors', async () => {
      const mockUser = createMockUser()
      const notFoundError = new Error('Not Found')
      notFoundError.name = 'NotFound'

      mockFind.mockRejectedValue(notFoundError)

      const req = createMockRequest({
        user: mockUser,
        payload: { find: mockFind } as any,
      })

      const response = await getUserJars(req)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toEqual({
        success: true,
        message: 'No Jars found',
        error: 'Not Found',
      })
    })
  })

  describe('Query parameters', () => {
    it('should query with correct limit', async () => {
      const mockUser = createMockUser()
      const mockJarData = { id: 'jar123', name: 'Test Jar' }

      mockFind.mockResolvedValue({
        docs: [mockJarData],
      })

      const req = createMockRequest({
        user: mockUser,
        payload: { find: mockFind } as any,
      })

      await getUserJars(req)

      expect(mockFind).toHaveBeenCalledWith({
        collection: 'jars',
        where: {
          or: [
            {
              creator: {
                equals: mockUser,
              },
              status: {
                not_equals: 'broken',
              },
            },
            {
              'invitedCollectors.collector': {
                equals: mockUser,
              },
              status: {
                not_equals: 'broken',
              },
            },
          ],
        },
        depth: 2,
        limit: 1000,
      })
    })

    it('should use OR condition to find jars where user is creator OR collector', async () => {
      const mockUser = createMockUser()

      mockFind.mockResolvedValue({
        docs: [],
      })

      const req = createMockRequest({
        user: mockUser,
        payload: { find: mockFind } as any,
      })

      await getUserJars(req)

      const callArgs = mockFind.mock.calls[0][0]
      expect(callArgs.where.or).toHaveLength(2)
      expect(callArgs.where.or[0]).toEqual({
        creator: {
          equals: mockUser,
        },
        status: {
          not_equals: 'broken',
        },
      })
      expect(callArgs.where.or[1]).toEqual({
        'invitedCollectors.collector': {
          equals: mockUser,
        },
        status: {
          not_equals: 'broken',
        },
      })
    })
  })

  describe('Response format', () => {
    it('should return consistent response structure on success', async () => {
      const mockUser = createMockUser()
      const mockJarData = {
        id: 'jar123',
        name: 'Test Jar',
        description: null,
        creator: mockUser,
        collectors: [],
        jarGroup: null,
        image: null,
        isActive: true,
        isFixedContribution: false,
        acceptedContributionAmount: null,
        goalAmount: 0,
        deadline: null,
        currency: 'ghc',
        paymentLink: null,
        acceptAnonymousContributions: false,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockFind.mockResolvedValue({
        docs: [mockJarData],
      })

      const req = createMockRequest({
        user: mockUser,
        payload: { find: mockFind } as any,
      })

      const response = await getUserJars(req)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData).toHaveProperty('success', true)
      expect(responseData).toHaveProperty('data')
      expect(responseData.data).toHaveLength(1)
      expect(responseData.data[0].id).toBe('ungrouped')
      expect(responseData.data[0].name).toBe('Ungrouped')
      expect(responseData.data[0].totalJars).toBe(1)
      expect(responseData.data[0].jars).toHaveLength(1)
    })

    it('should return consistent response structure on error', async () => {
      const mockUser = createMockUser()

      mockFind.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest({
        user: mockUser,
        payload: { find: mockFind } as any,
      })

      const response = await getUserJars(req)
      const responseData = await response.json()

      expect(responseData).toHaveProperty('success', true)
      expect(responseData).toHaveProperty('message', 'No Jars found')
      expect(responseData).toHaveProperty('error', 'Database error')
    })
  })
})
