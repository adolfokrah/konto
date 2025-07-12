import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'
import { CollectionConfig } from 'payload'
import { seteCreatedUpdatedBy } from './hooks/set_created_updated_by'

const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The name of the category, e.g., Electronics, Clothing, etc.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media', // Assuming you have a media collection for images
      required: false,
      admin: {
        description: 'Upload an image for the category. This is optional.',
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
      name: 'description',
      type: 'textarea',
      required: false,
      admin: {
        description: 'A brief description of the category.',
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

export default Categories
