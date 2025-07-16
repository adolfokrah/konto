import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'
import { type CollectionConfig } from 'payload'
import { validateUniqueBatchNumber } from './hooks/batchNumber'
import { validateExpiryDate } from './hooks/expiryDate'
import { validateStockAlert } from './hooks/stockAlert'
import { setCreatedUpdatedByAndResetProductWhenInactive, clearProductReferenceWhenInactive } from './hooks/index'

export const Batches: CollectionConfig = {
  slug: 'batches',
  access: {
    read: () => true,
    delete: () => false, // Prevent deletion of batches
  },
  admin: {
    useAsTitle: 'batchNumber',
  },
  defaultSort: 'expiryDate', // FIFO sorting - earliest expiry date first
  fields: [
    {
      name: 'shop',
      type: 'relationship',
      relationTo: 'shops',
      required: true,
      admin: {
        description: 'Select the shop associated with this stock entry.',
      },
    },
    {
      name: 'batchNumber',
      type: 'text',
      required: true,
      hooks: {
        beforeValidate: [validateUniqueBatchNumber],
      },
    },
    {
      name: 'expiryDate',
      type: 'date',
      required: true,
      hooks: {
        beforeValidate: [validateExpiryDate],
      },
    },
    {
      name: 'quantity',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true, // Prevent manual editing of quantity
        description:
          'This field is automatically updated based on the product inventory from stock updates.',
        components: {
          Cell: '@collectionComponents/QuantityCell', // Assuming you have a QuantityCell component for displaying quantities
        },
      },
    },
    {
      name: 'stockAlert',
      type: 'number',
      required: true,
      validate: validateStockAlert,
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      admin: {
        readOnly: true, // Prevent editing the product after batch creation
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
    beforeValidate: [setCreatedUpdatedByAndResetProductWhenInactive],
    afterChange: [clearProductReferenceWhenInactive],
  },
}
