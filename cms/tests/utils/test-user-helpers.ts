/**
 * Test helper utilities for user data creation with proper role field
 */

/**
 * Generate unique username for tests
 */
const generateUsername = (prefix: string = 'user') =>
  `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 5)}`

/**
 * Base user data template with required role field
 */
export const createTestUserData = (overrides: any = {}, role: 'user' | 'admin' = 'user') => ({
  role,
  kycStatus: 'verified' as const,
  username: generateUsername(),
  ...overrides,
})

/**
 * Create admin user data for tests
 */
export const createTestAdminData = (overrides: any = {}) => createTestUserData(overrides, 'admin')

/**
 * Create regular user data for tests
 */
export const createTestRegularUserData = (overrides: any = {}) =>
  createTestUserData(overrides, 'user')

/**
 * Create mock user object for request mocking
 */
export const createMockUser = (overrides: any = {}, role: 'user' | 'admin' = 'user') => ({
  id: 'mock-user-id',
  fullName: 'Test User',
  phoneNumber: '+233123456789',
  country: 'gh',
  email: 'test@example.com',
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  collection: 'users',
  role,
  ...overrides,
})
