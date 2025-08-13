import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach } from 'vitest'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'
import { registerUser } from '@collections/Users/endpoints/register-user'

let payload: Payload

const generateUniqueEmail = (prefix: string = 'test') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`

const generateUniquePhone = (countryCode: string = '+233') =>
  `${countryCode}54${Math.floor(Math.random() * 90000000) + 10000000}`

const createMockRequest = (data: any): any => ({
  payload,
  data,
  headers: new Headers(),
  method: 'POST',
  url: 'http://localhost/api/users/register-user',
})

describe('Register User Endpoint Integration Tests', () => {
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


  describe('POST /api/users/register-user', () => {
    it('should be a valid test file', () => {
      expect(true).toBe(true)
    })

    it('should create a new user via payload API', async () => {
      const phoneNumber = generateUniquePhone('+233')
      const email = generateUniqueEmail('newuser')

      const newUser = await payload.create({
        collection: 'users',
        data: {
          email,
          password: '123456',
          phoneNumber,
          countryCode: '+233',
          country: 'ghana',
          fullName: 'John Doe',
          isKYCVerified: false,
          appSettings: {
            language: 'en',
            darkMode: false,
            biometricAuthEnabled: false,
            notificationsSettings: {
              pushNotificationsEnabled: true,
              emailNotificationsEnabled: true,
              smsNotificationsEnabled: false,
            },
          },
        },
      })

      expect(newUser).toBeDefined()
      expect(newUser.phoneNumber).toBe(phoneNumber)
      expect(newUser.email).toBe(email)
      expect(newUser.fullName).toBe('John Doe')
      expect(newUser.country).toBe('ghana')
      expect(newUser.countryCode).toBe('+233')
      expect(newUser.isKYCVerified).toBe(false)
    })

    // Test the actual registerUser endpoint function
    it('should register a new user through registerUser endpoint', async () => {
      const phoneNumber = generateUniquePhone('+233')
      const email = generateUniqueEmail('endpoint')

      const mockRequest = createMockRequest({
        phoneNumber,
        countryCode: '+233',
        country: 'ghana',
        fullName: 'Jane Doe',
        email,
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.message).toBe('User registered successfully')
      expect(result.doc).toBeDefined()
      expect(result.user).toBeDefined()
      expect(result.doc.phoneNumber).toBe(phoneNumber)
      expect(result.doc.email).toBe(email)
      expect(result.doc.fullName).toBe('Jane Doe')
      expect(result.doc.country).toBe('ghana')
      expect(result.doc.countryCode).toBe('+233')
      expect(result.doc.isKYCVerified).toBe(false)
    })

    it('should register a user without email (auto-generate email)', async () => {
      const phoneNumber = generateUniquePhone('+234')

      const mockRequest = createMockRequest({
        phoneNumber,
        countryCode: '+234',
        country: 'nigeria',
        fullName: 'Auto Email User',
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.doc.phoneNumber).toBe(phoneNumber)
      expect(result.doc.email).toBe(`${phoneNumber.replace(/\+/g, '')}@konto.app`)
      expect(result.doc.fullName).toBe('Auto Email User')
      expect(result.doc.country).toBe('nigeria')
    })
  })

  describe('Validation Errors', () => {
    it('should return 400 when phoneNumber is missing', async () => {
      const mockRequest = createMockRequest({
        countryCode: '+233',
        country: 'ghana',
        fullName: 'John Doe',
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Missing required fields: phoneNumber, countryCode, country, fullName are required')
    })

    it('should return 400 when countryCode is missing', async () => {
      const phoneNumber = generateUniquePhone()

      const mockRequest = createMockRequest({
        phoneNumber,
        country: 'ghana',
        fullName: 'John Doe',
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Missing required fields: phoneNumber, countryCode, country, fullName are required')
    })

    it('should return 400 when country is missing', async () => {
      const phoneNumber = generateUniquePhone()

      const mockRequest = createMockRequest({
        phoneNumber,
        countryCode: '+233',
        fullName: 'John Doe',
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Missing required fields: phoneNumber, countryCode, country, fullName are required')
    })

    it('should return 400 when fullName is missing', async () => {
      const phoneNumber = generateUniquePhone()

      const mockRequest = createMockRequest({
        phoneNumber,
        countryCode: '+233',
        country: 'ghana',
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Missing required fields: phoneNumber, countryCode, country, fullName are required')
    })

    it('should return 400 when all required fields are missing', async () => {
      const mockRequest = createMockRequest({})

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Missing required fields: phoneNumber, countryCode, country, fullName are required')
    })
  })

  describe('User Already Exists Scenarios', () => {
    let existingUser: any

    beforeEach(async () => {
      // Create an existing user for duplicate tests
      existingUser = await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('existing'),
          password: '123456',
          phoneNumber: generateUniquePhone('+233'),
          countryCode: '+233',
          country: 'ghana',
          fullName: 'Existing User',
          isKYCVerified: false,
        },
      })
    })

    it('should return 409 when user exists with same phone number and country code', async () => {
      const mockRequest = createMockRequest({
        phoneNumber: existingUser.phoneNumber,
        countryCode: existingUser.countryCode,
        country: 'ghana',
        fullName: 'Another User',
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.success).toBe(false)
      expect(result.message).toBe('User already exists with this phone number')
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('phoneNumber')
      expect(result.errors[0].message).toBe('Phone number already registered')
    })

    it('should return 409 when user exists with same email', async () => {
      const phoneNumber = generateUniquePhone('+234')

      const mockRequest = createMockRequest({
        phoneNumber,
        countryCode: '+234',
        country: 'nigeria',
        fullName: 'Another User',
        email: existingUser.email,
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.success).toBe(false)
      expect(result.message).toBe('User already exists with this email')
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('email')
      expect(result.errors[0].message).toBe('Email already registered')
    })

    it('should allow same phone number with different country code', async () => {
      // Extract just the number part without country code
      const phoneNumberPart = existingUser.phoneNumber.replace('+233', '')
      const newPhoneNumber = `+234${phoneNumberPart}`

      const mockRequest = createMockRequest({
        phoneNumber: newPhoneNumber,
        countryCode: '+234',
        country: 'nigeria',
        fullName: 'Different Country User',
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.doc.phoneNumber).toBe(newPhoneNumber)
      expect(result.doc.countryCode).toBe('+234')
    })

    it('should allow different phone number with same country code', async () => {
      const newPhoneNumber = generateUniquePhone('+233')

      const mockRequest = createMockRequest({
        phoneNumber: newPhoneNumber,
        countryCode: '+233',
        country: 'ghana',
        fullName: 'Different Phone User',
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.doc.phoneNumber).toBe(newPhoneNumber)
      expect(result.doc.countryCode).toBe('+233')
    })
  })

  describe('Edge Cases and Data Validation', () => {
    it('should handle phone numbers with special characters', async () => {
      const phoneNumber = '+233-54-123-4567'

      const mockRequest = createMockRequest({
        phoneNumber,
        countryCode: '+233',
        country: 'ghana',
        fullName: 'Special Char User',
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.doc.phoneNumber).toBe(phoneNumber)
    })

    it('should handle names with special characters and spaces', async () => {
      const phoneNumber = generateUniquePhone('+233')
      const specialName = "John O'Connor-Smith Jr."

      const mockRequest = createMockRequest({
        phoneNumber,
        countryCode: '+233',
        country: 'ghana',
        fullName: specialName,
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.doc.fullName).toBe(specialName)
    })

    it('should handle different country values', async () => {
      const countries = ['ghana', 'nigeria', 'kenya', 'south africa']
      
      for (const country of countries) {
        const phoneNumber = generateUniquePhone('+233')
        
        const mockRequest = createMockRequest({
          phoneNumber,
          countryCode: '+233',
          country,
          fullName: `User from ${country}`,
        })

        const response = await registerUser(mockRequest)
        const result = await response.json()

        expect(response.status).toBe(201)
        expect(result.success).toBe(true)
        expect(result.doc.country).toBe(country)
      }
    })

    it('should set correct default app settings', async () => {
      const phoneNumber = generateUniquePhone('+233')

      const mockRequest = createMockRequest({
        phoneNumber,
        countryCode: '+233',
        country: 'ghana',
        fullName: 'Settings Test User',
      })

      const response = await registerUser(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.doc.appSettings).toBeDefined()
      expect(result.doc.appSettings.language).toBe('en')
      expect(result.doc.appSettings.darkMode).toBe(false)
      expect(result.doc.appSettings.biometricAuthEnabled).toBe(false)
      expect(result.doc.appSettings.notificationsSettings.pushNotificationsEnabled).toBe(true)
      expect(result.doc.appSettings.notificationsSettings.emailNotificationsEnabled).toBe(true)
      expect(result.doc.appSettings.notificationsSettings.smsNotificationsEnabled).toBe(false)
    })

    it('should handle various email formats', async () => {
      const emailFormats = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@sub.example.com',
      ]
      
      for (const email of emailFormats) {
        const phoneNumber = generateUniquePhone('+233')
        
        const mockRequest = createMockRequest({
          phoneNumber,
          countryCode: '+233',
          country: 'ghana',
          fullName: 'Email Format User',
          email,
        })

        const response = await registerUser(mockRequest)
        const result = await response.json()

        expect(response.status).toBe(201)
        expect(result.success).toBe(true)
        expect(result.doc.email).toBe(email)
      }
    })
  })
})
