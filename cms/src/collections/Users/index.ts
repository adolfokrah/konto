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
import { backfillReferralCodes } from './endpoints/backfill-referral-codes'
import { changePassword } from './endpoints/change-password'
import {
  adminOnly,
  adminOnlyField,
  queryableSelfOrAdminField,
  selfOrAdminField,
} from '@/access/users'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'firstName',
    defaultColumns: ['firstName', 'lastName', 'username', 'phoneNumber', 'kycStatus', 'role'],
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days in seconds
  },
  access: {
    // Only allow admin users to access the CMS
    admin: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
    // Sign-up goes through /users/register-user (local API); direct REST creates are admin-only
    // so nobody can create an account with a chosen role or verification status.
    create: adminOnly,
    // Logged-in users can look each other up (e.g. inviting collectors); contact details,
    // tokens and staff fields are field-restricted below.
    read: ({ req: { user } }) => Boolean(user),
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
    {
      path: '/backfill-referral-codes',
      method: 'post',
      handler: backfillReferralCodes,
    },
    {
      path: '/change-password',
      method: 'post',
      handler: changePassword,
    },
  ],
  fields: [
    // Same-named fields are merged into Payload's auth fields, adding read access to them.
    {
      name: 'email',
      type: 'email',
      // Searchable (collaborator search) but only readable by the user or an admin.
      access: { read: queryableSelfOrAdminField },
    },
    {
      name: 'sessions',
      type: 'array',
      access: { read: selfOrAdminField },
      fields: [],
    },
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
      access: { read: selfOrAdminField },
      type: 'text',
      admin: {
        description: 'Country code for the phone number, e.g., +233 for Ghana',
      },
    },
    {
      name: 'phoneNumber',
      access: { read: selfOrAdminField },
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
      access: { read: selfOrAdminField, create: adminOnlyField, update: adminOnlyField },
      type: 'text',
      required: false,
      admin: {
        readOnly: true,
        description: 'KYC session ID from the KYC provider',
      },
    },
    {
      name: 'fcmToken',
      access: { read: selfOrAdminField },
      type: 'text',
      required: false,
      admin: {
        readOnly: true,
        description: 'Firebase Cloud Messaging token for push notifications',
      },
    },
    {
      name: 'platform',
      access: { read: selfOrAdminField },
      type: 'select',
      required: false,
      options: [
        { label: 'Android', value: 'android' },
        { label: 'iOS', value: 'ios' },
      ],
      admin: {
        readOnly: true,
        description: 'Mobile platform the user is using',
      },
    },
    {
      name: 'otpCode',
      access: { read: adminOnlyField, create: adminOnlyField, update: adminOnlyField },
      type: 'text',
      required: false,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'otpExpiry',
      access: { read: adminOnlyField, create: adminOnlyField, update: adminOnlyField },
      type: 'text',
      required: false,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'otpAttempts',
      access: { read: adminOnlyField, create: adminOnlyField, update: adminOnlyField },
      type: 'number',
      required: false,
      defaultValue: 0,
      admin: {
        hidden: true,
      },
    },
    {
      // Set by verify-otp, consumed by login-with-phone: proof the number just passed OTP.
      name: 'otpVerifiedAt',
      type: 'date',
      required: false,
      access: { read: adminOnlyField, create: adminOnlyField, update: adminOnlyField },
      admin: {
        hidden: true,
      },
    },
    {
      name: 'kycStatus',
      access: { create: adminOnlyField, update: adminOnlyField },
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
      // Individuals verify with KYC; organizations with KYB plus the owner's KYC
      // (see utilities/kyb.ts). Chosen at sign-up; an approved KYB upgrades a user to
      // organization. Only admins can change it directly.
      name: 'accountType',
      type: 'select',
      options: [
        { label: 'Individual', value: 'individual' },
        { label: 'Organization', value: 'organization' },
      ],
      defaultValue: 'individual',
      required: false, // defaults to individual; users from before account types have none
      index: true,
      access: { create: adminOnlyField, update: adminOnlyField },
      admin: {
        position: 'sidebar',
        description: 'Individual (KYC) or Organization (KYB + owner KYC).',
      },
    },
    {
      name: 'kybStatus',
      access: { create: adminOnlyField, update: adminOnlyField },
      type: 'select',
      label: 'KYB Status',
      options: [
        { label: 'None', value: 'none' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      defaultValue: 'none',
      required: false,
      admin: {
        readOnly: true,
        description: 'Business verification status — synced from Business Verifications.',
      },
    },
    {
      // Reverse relation → the business verification(s) this user submitted.
      // Renders a table on the user edit page; each row opens the full
      // verification doc (business name, registration docs, directors, status).
      name: 'businessVerifications',
      type: 'join',
      collection: 'business-verifications',
      on: 'user',
      maxDepth: 2,
      admin: {
        allowCreate: true,
        defaultColumns: ['businessName', 'status', 'createdAt'],
        description: 'Business verification submitted by this user. Open a row to review or edit.',
      },
    },
    {
      name: 'role',
      access: { read: selfOrAdminField, create: adminOnlyField, update: adminOnlyField },
      type: 'select',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
        { label: 'Auditor', value: 'auditor' },
      ],
      defaultValue: 'user',
      required: true,
      admin: {
        description:
          'User role - admins have full access, auditors have read-only access to the dashboard',
      },
    },
    {
      name: 'referralCode',
      access: { create: adminOnlyField, update: adminOnlyField },
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated referral code for this user',
      },
    },
    {
      name: 'hogapayDiscountPercent',
      access: { read: selfOrAdminField, create: adminOnlyField, update: adminOnlyField },
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 100,
      admin: {
        description:
          "Discount on Hogapay's 0.8% collection fee (0 = no discount, 100 = full discount). Contributor pays less; Hogapay absorbs the difference.",
      },
    },
    {
      name: 'demoUser',
      access: { read: adminOnlyField, create: adminOnlyField, update: adminOnlyField },
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Demo users always use OTP 123456 and skip SMS/email sending',
      },
    },
    {
      name: 'lastActiveAt',
      access: { read: selfOrAdminField, create: adminOnlyField, update: adminOnlyField },
      type: 'date',
      required: false,
      admin: {
        description: 'Last time the user made an authenticated request (used for DAU tracking)',
        readOnly: true,
      },
    },
    {
      name: 'appSettings',
      access: { read: selfOrAdminField },
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
    beforeLogin: [
      ({ user, req }) => {
        // App users authenticate with phone + OTP (login-with-phone). Direct email/password
        // logins are for staff on the dashboard only.
        const isStaff = ['admin', 'auditor'].includes((user as { role?: string }).role ?? '')
        if (!isStaff && !req.context?.phoneLogin) {
          throw new APIError('Please log in with your phone number.', 403)
        }
        return user
      },
    ],
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
    beforeChange: [
      async ({ data, operation, req }) => {
        if ((operation === 'create' || operation === 'update') && !data.referralCode) {
          const username = (data.username || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
          const base = username.slice(0, 5).padEnd(5, '0')

          let code = base
          let suffix = 1
          while (suffix <= 99) {
            const existing = await req.payload.find({
              collection: 'users',
              where: { referralCode: { equals: code } },
              limit: 1,
              pagination: false,
            })
            if (existing.totalDocs === 0) break
            code = base.slice(0, 4) + suffix
            suffix++
          }

          data.referralCode = code
        }
        return data
      },
    ],
    afterChange: [sendWelcomeEmail],
    afterLogout: [
      async ({ req }) => {
        const userId = req.user?.id
        if (!userId) return
        try {
          await req.payload.update({
            collection: 'users',
            id: userId,
            data: { fcmToken: '' },
            overrideAccess: true,
          })
        } catch (e) {
          // Non-fatal — don't block logout
          console.error('[afterLogout] Failed to clear fcmToken:', e)
        }
      },
    ],
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
