import { APIError, type CollectionConfig } from 'payload'

import { checkUserExistence } from './endpoints/check-user-existence'
import { loginWithPhoneNumber } from './endpoints/login-with-phone-number'
import { registerUser } from './endpoints/register-user'
import { verifyAccountDetails } from './endpoints/verify-account-details'
import { manageUserRole } from './endpoints/manage-user-role'
import { updateKYC } from './endpoints/update-kyc'
import { requestKYC } from './endpoints/request-kyc'
import { verifyKYC } from './endpoints/verify-kyc'
import { diditWebhook } from './endpoints/didit-webhook'
import { sendKYCReminder } from './endpoints/send-kyc-reminder'
import { getJobStatus } from './endpoints/get-job-status'
import { accountDeletion } from './hooks/account-deletion'
import { sendWelcomeEmail } from './hooks/send-welcome-email'
import { trackDailyActiveUser } from './hooks/track-daily-active-user'
import { checkUsernameUniqueness } from './hooks/check-username-uniqueness'
import { sendOTP } from './endpoints/send-otp'
import { verifyOTP } from './endpoints/verify-otp'
import { deleteUserAccount } from './endpoints/delete-user-account'
import { testPushNotification } from './endpoints/test-push-notification'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'firstName',
    defaultColumns: ['firstName', 'lastName', 'username', 'phoneNumber', 'kycStatus', 'role'],
  },
  auth: true,
  access: {
    // Only allow admin users to access the CMS
    admin: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    // Allow public registration
    create: () => true,
    // Logged in users can read themselves, admins can read all
    read: () => true,
    // Users can update themselves, admins can update all
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') {
        return true // Admins can update all users
      }
      if (user) {
        return { id: { equals: user.id } } // Users can only update themselves
      }
      return false
    },
    // Admins can delete any user, users can delete themselves
    delete: ({ req: { user } }) => {
      if (user?.role === 'admin') {
        return true // Admins can delete any user
      }
      if (user) {
        return { id: { equals: user.id } } // Users can only delete themselves
      }
      return false
    },
  },
  endpoints: [
    {
      path: '/login-with-phone',
      method: 'post',
      handler: loginWithPhoneNumber,
    },
    {
      path: '/check-user-existence',
      method: 'post',
      handler: checkUserExistence,
    },
    {
      path: '/register-user',
      method: 'post',
      handler: registerUser,
    },
    {
      path: '/verify-account-details',
      method: 'post',
      handler: verifyAccountDetails,
    },
    {
      path: '/manage-role',
      method: 'post',
      handler: manageUserRole,
    },
    {
      path: '/send-otp',
      method: 'post',
      handler: sendOTP,
    },
    {
      path: '/verify-otp',
      method: 'post',
      handler: verifyOTP,
    },
    {
      path: '/update-kyc',
      method: 'post',
      handler: updateKYC,
    },
    {
      path: '/request-kyc',
      method: 'post',
      handler: requestKYC,
    },
    {
      path: '/verify-kyc',
      method: 'get',
      handler: verifyKYC,
    },
    {
      path: '/didit-webhook',
      method: 'post',
      handler: diditWebhook,
    },
    {
      path: '/send-kyc-reminder',
      method: 'post',
      handler: sendKYCReminder,
    },
    {
      path: '/job-status',
      method: 'get',
      handler: getJobStatus,
    },
    {
      path: '/delete-account',
      method: 'post',
      handler: deleteUserAccount,
    },
    {
      path: '/test-push-notification',
      method: 'post',
      handler: testPushNotification,
    },
  ],
  fields: [
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Upload a profile photo',
      },
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique username - cannot be changed once set',
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string' && value !== null && value !== undefined) {
          return 'Username must be a string'
        }
        if (value && typeof value === 'string') {
          // Username validation rules
          if (value.length < 3) {
            return 'Username must be at least 3 characters long'
          }
          if (value.length > 30) {
            return 'Username must be at most 30 characters long'
          }
          if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            return 'Username can only contain letters, numbers, and underscores'
          }
        }
        return true
      },
    },
    {
      name: 'countryCode',
      type: 'text',
      admin: {
        description: 'Country code for the phone number, e.g., +233 for Ghana',
      },
    },
    {
      name: 'phoneNumber',
      type: 'text',
      required: true,
    },
    {
      name: 'country',
      type: 'text',
      required: true,
    },
    {
      name: 'kycSessionId',
      type: 'text',
      required: false,
      admin: {
        readOnly: true,
        description: 'KYC session ID from the KYC provider',
      },
    },
    {
      name: 'fcmToken',
      type: 'text',
      required: false,
      admin: {
        readOnly: true,
        description: 'Firebase Cloud Messaging token for push notifications',
      },
    },
    {
      name: 'otpCode',
      type: 'text',
      required: false,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'otpExpiry',
      type: 'text',
      required: false,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'otpAttempts',
      type: 'number',
      required: false,
      defaultValue: 0,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'kycStatus',
      type: 'select',
      options: [
        { label: 'None', value: 'none' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Verified', value: 'verified' },
      ],
      defaultValue: 'none',
      required: false,
      hooks: {
        beforeChange: [
          ({ data, originalDoc, value }) => {
            console.log('🔄 kycStatus beforeChange hook:', {
              originalValue: originalDoc?.kycStatus,
              newValue: value,
              dataValue: data?.kycStatus,
            })
            return value
          },
        ],
      },
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: 'user',
      required: true,
      admin: {
        description: 'User role - only admin users can access the CMS',
      },
    },
    {
      name: 'demoUser',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Demo users always use OTP 123456 and skip SMS/email sending',
      },
    },
    {
      label: 'Withdrawal Account',
      type: 'group',
      fields: [
        {
          name: 'bank',
          type: 'text',
        },
        {
          name: 'accountNumber',
          type: 'text',
        },
        {
          name: 'accountHolder',
          type: 'text',
        },
      ],
    },
    {
      name: 'appSettings',
      type: 'group',
      fields: [
        {
          name: 'language',
          type: 'select',
          options: [
            { label: 'English', value: 'en' },
            { label: 'French', value: 'fr' },
          ],
          defaultValue: 'en',
        },
        {
          name: 'theme',
          type: 'select',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'System', value: 'system' },
          ],
          defaultValue: 'system',
        },
        {
          name: 'biometricAuthEnabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'notificationsSettings',
          type: 'group',
          fields: [
            {
              name: 'pushNotificationsEnabled',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'emailNotificationsEnabled',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'smsNotificationsEnabled',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      checkUsernameUniqueness,
      async ({ data, originalDoc, operation, req }) => {
        if (!data || operation !== 'update') {
          return
        }

        // Check if phone number or email changed
        const phoneChanged = data.phoneNumber !== originalDoc.phoneNumber
        const countryCodeChanged = data.countryCode !== originalDoc.countryCode
        const emailChanged = data.email !== originalDoc.email

        if (phoneChanged || countryCodeChanged || emailChanged) {
          const { payload } = req

          // Check phone number if changed
          if ((phoneChanged || countryCodeChanged) && data.phoneNumber && data.countryCode) {
            const formattedPhoneNumber =
              data.phoneNumber?.startsWith('0') && data.phoneNumber.length > 1
                ? data.phoneNumber.substring(1)
                : data.phoneNumber

            const existingUserByPhone = await payload.find({
              collection: 'users',
              where: {
                and: [
                  { phoneNumber: { equals: formattedPhoneNumber } },
                  { countryCode: { equals: data.countryCode } },
                  { id: { not_equals: originalDoc.id } }, // Exclude current user
                ],
              },
              limit: 1,
            })

            if (existingUserByPhone.docs.length > 0) {
              throw new APIError(
                'This phone number is already registered with another account.',
                409,
              )
            }
          }

          // Check email if changed
          if (emailChanged && data.email) {
            const existingUserByEmail = await payload.find({
              collection: 'users',
              where: {
                and: [
                  { email: { equals: data.email } },
                  { id: { not_equals: originalDoc.id } }, // Exclude current user
                ],
              },
              limit: 1,
            })

            if (existingUserByEmail.docs.length > 0) {
              throw new APIError(
                'This email address is already registered with another account.',
                409,
              )
            }
          }
        }
      },
    ],
    beforeChange: [],
    afterChange: [sendWelcomeEmail],
    beforeDelete: [accountDeletion],
    afterRead: [
      ({ doc }) => {
        // Compute virtual fullName from firstName and lastName
        doc.fullName = `${doc.firstName || ''} ${doc.lastName || ''}`.trim()
        return doc
      },
      trackDailyActiveUser,
    ],
  },
}
