import type { CollectionConfig } from 'payload'

import { checkUserExistence } from './endpoints/check-user-existence'
import { loginWithPhoneNumber } from './endpoints/login-with-phone-number'
import { registerUser } from './endpoints/register-user'
import { verifyAccountDetails } from './endpoints/verify-account-details'
import { manageUserRole } from './endpoints/manage-user-role'
import { sendWhatsAppOtp } from './endpoints/send-whatsapp-otp'
import { createSubAccount } from './hooks/create-sub-account'
import { updateKYC } from './endpoints/update-kyc'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'fullName',
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
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') {
        return true // Admins can read all users
      }
      if (user) {
        return { id: { equals: user.id } } // Users can only read themselves
      }
      return false
    },
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
    // Only admins can delete
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
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
      path: '/send-whatsapp-otp',
      method: 'post',
      handler: sendWhatsAppOtp,
    },
    {
      path: '/update-kyc',
      method: 'post',
      handler: updateKYC,
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
      name: 'fullName',
      type: 'text',
      required: true,
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
      name: 'isKYCVerified',
      type: 'checkbox',
      defaultValue: true, //only for testing
      hooks: {
        beforeChange: [
          ({ data, originalDoc, operation }) => {
            // Only apply this logic for updates, not creation
            if (operation === 'update' && data && originalDoc) {
              // Check if fullName or country has changed
              const fullNameChanged = data.fullName && data.fullName !== originalDoc.fullName
              const countryChanged = data.country && data.country !== originalDoc.country

              if (fullNameChanged || countryChanged) {
                console.log('Critical user information changed - resetting KYC verification status')
                data.isKYCVerified = false
                // Also reset KYC status if it exists
                if (data.kycStatus) {
                  data.kycStatus = 'pending'
                }
              }
            }
          },
        ],
      },
    },
    {
      name: 'frontFile',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'backFile',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'photoFile',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'documentType',
      type: 'text',
      required: false,
    },
    {
      name: 'kycStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Verified', value: 'verified' },
      ],
      required: false,
      hooks: {
        beforeChange: [
          ({ data, originalDoc }) => {
            // Prevent manual setting to 'verified'
            if (data && originalDoc) {
              if (data.kycStatus === 'verified' && originalDoc.kycStatus !== 'verified') {
                console.log('Manual setting of KYC status to verified is not allowed')
                data.kycStatus = originalDoc.kycStatus || 'pending'
              }
            }
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
        {
          name: 'paystackSubAccountCode',
          type: 'text',
          admin: {
            readOnly: true,
          },
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
    beforeChange: [createSubAccount],
  },
}
