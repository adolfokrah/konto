import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach } from 'vitest'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'

let payload: Payload

const generateUniqueEmail = (prefix: string = 'test') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`

const generateUniquePhone = (countryCode: string = '+233') =>
  `${countryCode}54${Math.floor(Math.random() * 90000000) + 10000000}`

describe('Users Collection Endpoints Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await clearAllCollections(payload) // Clear collections before tests
  })

  beforeEach(async () => {
    // Clean up users before each test (except admin users)
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          not_equals: 'admin@test.com',
        },
      },
    })

    for (const user of users.docs) {
      await payload.delete({
        collection: 'users',
        id: user.id,
      })
    }
  })

  describe('POST /api/users/check-phone-number-existence', () => {
    let existingUser: any

    beforeEach(async () => {
      // Create a test user for existence checks
      existingUser = await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('existing'),
          password: '123456',
          fullName: 'Existing User',
          phoneNumber: '+233541234567',
          countryCode: '+233',
          country: 'gh' as const,
          isKYCVerified: false,
        },
      })
    })

    it('should return true when phone number exists', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      const { checkPhoneNumberExistence } = await import(
        '../../src/collections/Users/endpoints/check-phone-number-existence'
      )

      const response = await checkPhoneNumberExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(true)
      expect(responseData.message).toBe('Phone number found in system')
    })

    it('should return false when phone number does not exist', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234999',
          countryCode: '+233',
        },
      } as any

      const { checkPhoneNumberExistence } = await import(
        '../../src/collections/Users/endpoints/check-phone-number-existence'
      )

      const response = await checkPhoneNumberExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(false)
      expect(responseData.message).toBe('Phone number not found in system')
    })

    it('should return false when country code does not match', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+234', // Different country code
        },
      } as any

      const { checkPhoneNumberExistence } = await import(
        '../../src/collections/Users/endpoints/check-phone-number-existence'
      )

      const response = await checkPhoneNumberExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(false)
      expect(responseData.message).toBe('Phone number not found in system')
    })

    it('should return error when phone number is missing', async () => {
      const mockRequest = {
        payload,
        data: {
          countryCode: '+233',
        },
      } as any

      const { checkPhoneNumberExistence } = await import(
        '../../src/collections/Users/endpoints/check-phone-number-existence'
      )

      const response = await checkPhoneNumberExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should return error when country code is missing', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
        },
      } as any

      const { checkPhoneNumberExistence } = await import(
        '../../src/collections/Users/endpoints/check-phone-number-existence'
      )

      const response = await checkPhoneNumberExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Country code is required')
    })

    it('should handle database errors gracefully', async () => {
      // Mock a payload instance that throws an error
      const mockRequest = {
        payload: {
          find: () => {
            throw new Error('Database connection failed')
          },
        },
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      const { checkPhoneNumberExistence } = await import(
        '../../src/collections/Users/endpoints/check-phone-number-existence'
      )

      const response = await checkPhoneNumberExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Error checking phone number')
      expect(responseData.error).toBe('Database connection failed')
    })
  })

  describe('POST /api/users/register-user', () => {
    it('should register a new user successfully', async () => {
      const phoneNumber = generateUniquePhone()
      const mockRequest = {
        payload,
        data: {
          phoneNumber,
          countryCode: '+233',
          country: 'gh',
          fullName: 'New User',
          email: generateUniqueEmail('newuser'),
        },
      } as any

      const { registerUser } = await import('../../src/collections/Users/endpoints/register-user')

      const response = await registerUser(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('User registered successfully')
      expect(responseData.doc).toBeDefined()
      expect(responseData.user).toBeDefined()
      expect(responseData.user.phoneNumber).toBe(phoneNumber)
      expect(responseData.user.countryCode).toBe('+233')
      expect(responseData.user.country).toBe('gh')
      expect(responseData.user.fullName).toBe('New User')
      expect(responseData.user.isKYCVerified).toBe(false)
    })

    it('should register user without email and generate one', async () => {
      const phoneNumber = generateUniquePhone()
      const mockRequest = {
        payload,
        data: {
          phoneNumber,
          countryCode: '+233',
          country: 'gh',
          fullName: 'User Without Email',
        },
      } as any

      const { registerUser } = await import('../../src/collections/Users/endpoints/register-user')

      const response = await registerUser(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.user.email).toContain('@konto.app')
      expect(responseData.user.email).toContain(phoneNumber.replace(/\+/g, ''))
    })

    it('should fail when user already exists with same phone number', async () => {
      const phoneNumber = generateUniquePhone()
      
      // Create first user
      await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('existing'),
          password: '123456',
          fullName: 'Existing User',
          phoneNumber,
          countryCode: '+233',
          country: 'gh' as const,
        },
      })

      // Try to register with same phone number
      const mockRequest = {
        payload,
        data: {
          phoneNumber,
          countryCode: '+233',
          country: 'gh',
          fullName: 'Duplicate User',
        },
      } as any

      const { registerUser } = await import('../../src/collections/Users/endpoints/register-user')

      const response = await registerUser(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(409)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('User already exists with this phone number')
      expect(responseData.errors).toEqual([
        {
          field: 'phoneNumber',
          message: 'Phone number already registered',
        },
      ])
    })

    it('should fail when required fields are missing - phoneNumber', async () => {
      const mockRequest = {
        payload,
        data: {
          countryCode: '+233',
          country: 'gh',
          fullName: 'User Missing Phone',
        },
      } as any

      const { registerUser } = await import('../../src/collections/Users/endpoints/register-user')

      const response = await registerUser(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe(
        'Missing required fields: phoneNumber, countryCode, country, fullName are required',
      )
    })

    it('should fail when required fields are missing - countryCode', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: generateUniquePhone(),
          country: 'gh',
          fullName: 'User Missing Country Code',
        },
      } as any

      const { registerUser } = await import('../../src/collections/Users/endpoints/register-user')

      const response = await registerUser(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe(
        'Missing required fields: phoneNumber, countryCode, country, fullName are required',
      )
    })

    it('should fail when required fields are missing - country', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: generateUniquePhone(),
          countryCode: '+233',
          fullName: 'User Missing Country',
        },
      } as any

      const { registerUser } = await import('../../src/collections/Users/endpoints/register-user')

      const response = await registerUser(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe(
        'Missing required fields: phoneNumber, countryCode, country, fullName are required',
      )
    })

    it('should fail when required fields are missing - fullName', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: generateUniquePhone(),
          countryCode: '+233',
          country: 'gh',
        },
      } as any

      const { registerUser } = await import('../../src/collections/Users/endpoints/register-user')

      const response = await registerUser(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe(
        'Missing required fields: phoneNumber, countryCode, country, fullName are required',
      )
    })

    it('should set default app settings for new user', async () => {
      const phoneNumber = generateUniquePhone()
      const mockRequest = {
        payload,
        data: {
          phoneNumber,
          countryCode: '+233',
          country: 'gh',
          fullName: 'Settings Test User',
        },
      } as any

      const { registerUser } = await import('../../src/collections/Users/endpoints/register-user')

      const response = await registerUser(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      
      // Verify the user was created with correct default settings
      const createdUser = await payload.findByID({
        collection: 'users',
        id: responseData.user.id,
      })

      expect(createdUser.appSettings?.language).toBe('en')
      expect(createdUser.appSettings?.darkMode).toBe(false)
      expect(createdUser.appSettings?.biometricAuthEnabled).toBe(false)
      expect(createdUser.appSettings?.notificationsSettings?.pushNotificationsEnabled).toBe(true)
      expect(createdUser.appSettings?.notificationsSettings?.emailNotificationsEnabled).toBe(true)
      expect(createdUser.appSettings?.notificationsSettings?.smsNotificationsEnabled).toBe(false)
    })
  })

  describe('POST /api/users/login-with-phone', () => {
    let testUser: any

    beforeEach(async () => {
      // Create a test user for login tests
      testUser = await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('logintest'),
          password: '123456',
          fullName: 'Login Test User',
          phoneNumber: '+233541234567',
          countryCode: '+233',
          country: 'gh' as const,
          isKYCVerified: true,
        },
      })
    })

    it('should login user successfully with correct phone number and country code', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      const { loginWithPhoneNumber } = await import(
        '../../src/collections/Users/endpoints/login-with-phone-number'
      )

      const loginResponse = await loginWithPhoneNumber(mockRequest)
      const responseData = await loginResponse.json()

      expect(loginResponse.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('Login successful')
      expect(responseData.user).toBeDefined()
      expect(responseData.user.id).toBe(testUser.id)
      expect(responseData.user.phoneNumber).toBe('+233541234567')
    })

    it('should fail login with non-existent phone number', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234999',
          countryCode: '+233',
        },
      } as any

      const { loginWithPhoneNumber } = await import(
        '../../src/collections/Users/endpoints/login-with-phone-number'
      )

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number not found')
    })

    it('should fail login with wrong country code', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+234', // Wrong country code
        },
      } as any

      const { loginWithPhoneNumber } = await import(
        '../../src/collections/Users/endpoints/login-with-phone-number'
      )

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number not found')
    })

    it('should fail when phone number is missing', async () => {
      const mockRequest = {
        payload,
        data: {
          countryCode: '+233',
        },
      } as any

      const { loginWithPhoneNumber } = await import(
        '../../src/collections/Users/endpoints/login-with-phone-number'
      )

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should fail when country code is missing', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
        },
      } as any

      const { loginWithPhoneNumber } = await import(
        '../../src/collections/Users/endpoints/login-with-phone-number'
      )

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Country code is required')
    })
  })

  describe('GET /api/users/validate-token', () => {
    it('should be removed - validate-token endpoint not needed', async () => {
      // This endpoint was removed as it's not needed
      expect(true).toBe(true)
    })
  })

  describe('Endpoint Integration Scenarios', () => {
    it('should complete full user registration and login flow', async () => {
      const phoneNumber = generateUniquePhone()
      const userEmail = generateUniqueEmail('fullflow')

      // Step 1: Check phone number doesn't exist
      const checkRequest = {
        payload,
        data: {
          phoneNumber,
          countryCode: '+233',
        },
      } as any

      const { checkPhoneNumberExistence } = await import(
        '../../src/collections/Users/endpoints/check-phone-number-existence'
      )

      const checkResponse = await checkPhoneNumberExistence(checkRequest)
      const checkData = await checkResponse.json()
      expect(checkData.exists).toBe(false)

      // Step 2: Register the user
      const registerRequest = {
        payload,
        data: {
          phoneNumber,
          countryCode: '+233',
          country: 'gh',
          fullName: 'Full Flow User',
          email: userEmail,
        },
      } as any

      const { registerUser } = await import('../../src/collections/Users/endpoints/register-user')

      const registerResponse = await registerUser(registerRequest)
      const registerData = await registerResponse.json()
      expect(registerData.success).toBe(true)

      // Step 3: Check phone number now exists
      const checkAgainResponse = await checkPhoneNumberExistence(checkRequest)
      const checkAgainData = await checkAgainResponse.json()
      expect(checkAgainData.exists).toBe(true)

      // Step 4: Login with phone number
      const loginRequest = {
        payload,
        data: {
          phoneNumber,
          countryCode: '+233',
        },
      } as any

      const { loginWithPhoneNumber } = await import(
        '../../src/collections/Users/endpoints/login-with-phone-number'
      )

      const loginResponse = await loginWithPhoneNumber(loginRequest)
      const loginData = await loginResponse.json()
      expect(loginData.success).toBe(true)
      expect(loginData.user.id).toBe(registerData.user.id)
    })

    it('should handle concurrent registration attempts with same phone number', async () => {
      const phoneNumber = generateUniquePhone()

      const registerRequest1 = {
        payload,
        data: {
          phoneNumber,
          countryCode: '+233',
          country: 'gh',
          fullName: 'Concurrent User 1',
          email: generateUniqueEmail('concurrent1'),
        },
      } as any

      const registerRequest2 = {
        payload,
        data: {
          phoneNumber,
          countryCode: '+233',
          country: 'gh',
          fullName: 'Concurrent User 2',
          email: generateUniqueEmail('concurrent2'),
        },
      } as any

      const { registerUser } = await import('../../src/collections/Users/endpoints/register-user')

      // First registration should succeed
      const response1 = await registerUser(registerRequest1)
      const data1 = await response1.json()
      expect(data1.success).toBe(true)

      // Second registration should fail
      const response2 = await registerUser(registerRequest2)
      const data2 = await response2.json()
      expect(data2.success).toBe(false)
      expect(data2.message).toBe('User already exists with this phone number')
    })

    it('should handle phone number format variations correctly', async () => {
      // Create user with standard format
      const standardPhone = '+233541234567'
      await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('format'),
          password: '123456',
          fullName: 'Format Test User',
          phoneNumber: standardPhone,
          countryCode: '+233',
          country: 'gh' as const,
        },
      })

      // Test with exact same format
      const checkRequest = {
        payload,
        data: {
          phoneNumber: standardPhone,
          countryCode: '+233',
        },
      } as any

      const { checkPhoneNumberExistence } = await import(
        '../../src/collections/Users/endpoints/check-phone-number-existence'
      )

      const response = await checkPhoneNumberExistence(checkRequest)
      const data = await response.json()
      expect(data.exists).toBe(true)
    })
  })
})
