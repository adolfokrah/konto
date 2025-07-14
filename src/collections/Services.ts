import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'
import type { CollectionConfig } from 'payload'
import { seteCreatedUpdatedBy } from './hooks/set_created_updated_by'

export const Services: CollectionConfig = {
  slug: 'services',
  access: {
    read: () => true,
    delete: () => false, // Prevent deletion of services
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['id', 'name', 'image', 'description', 'price', 'shop'],
  },
  fields: [
    {
      name: 'shop',
      type: 'relationship',
      relationTo: 'shops',
      required: true,
      admin: {
        description: 'Select the shop associated with this service.',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories', // Assuming you have a Categories collection
      required: true,
      hasMany: false,
      admin: {
        description: 'Select the category for this service.',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'A brief description of the service.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media', // Assuming you have a Media collection for images
      required: false,
      admin: {
        description: 'Upload an image for the service.',
      },
    },
    {
      name: 'color',
      type: 'text',
      required: false,
      admin: {
        description: 'A color code for the category, e.g., #FF5733 for red.',
        components: {
          Cell: './components/ColorCell', // Assuming you have a ColorCell component for displaying colors
        },
        condition: (data, siblingData) => {
          return !siblingData.image
        },
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      admin: {
        description: 'The price of the service.',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }, // Assuming you want to keep this option
      ],
      defaultValue: 'active',
      admin: {
        description: 'The status of the service.',
      },
    },
    ...CREATED_UPDATED_BY_FIELDS,
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        // Automatically set createdBy to the current user
        return seteCreatedUpdatedBy({
          data,
          operation,
          userId: req.user ? req.user.id : null,
        })
      },
    ],
  },
}
