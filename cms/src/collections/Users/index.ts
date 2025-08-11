import type { CollectionConfig } from 'payload'
import { loginWithPhoneNumber } from './endpoints/login-with-phone-number'
import { checkPhoneNumberExistence } from './endpoints/check-phone-number-existence'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'fullName',
  },
  auth: true,
  endpoints: [
    {
      path: '/login-with-phone',
      method: 'post',
      handler: loginWithPhoneNumber,
    },
    {
      path: '/check-phone-number-existence',
      method: 'post',
      handler: checkPhoneNumberExistence,
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
      }
    },
    {
      name: 'phoneNumber',
      type: 'text',
      required: true,
    },
    {
      name: 'country',
      type: 'select',
      options: [
        { label: 'Ghana', value: 'gh' },
        { label: 'Nigeria', value: 'ng' },
      ],
      required: true,
    },
    {
      name: 'isKYCVerified',
      type: 'checkbox',
      defaultValue: false,
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
          name: 'darkMode',
          type: 'checkbox',
          defaultValue: false,
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
}
