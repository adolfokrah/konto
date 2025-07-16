import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'

import { CollectionConfig } from 'payload'

import { setCreatedUpdatedBy } from './hooks/index'

const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The name of the supplier.',
      },
    },
    {
      name: 'contactInfo',
      type: 'group',
      fields: [
        {
          name: 'email',
          type: 'email',
          required: false,
          admin: {
            description: 'Email address of the supplier.',
          },
        },
        {
          name: 'phone',
          type: 'text',
          required: false,
          admin: {
            description: 'Phone number of the supplier.',
          },
        },
      ],
    },
    ...CREATED_UPDATED_BY_FIELDS,
  ],
  hooks: {
    beforeValidate: [setCreatedUpdatedBy],
  },
}
export default Customers
