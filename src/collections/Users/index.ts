import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'fullName',
      type: 'text',
      required: true,
    },
    {
      name: 'countryCode',
      type: 'text',
      required: true,
      defaultValue: '+233', // Default to Ghana's country code
    },
    {
      name: 'phoneNumber',
      type: 'text',
      required: true,
      validate: (data: any) => {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/ // Basic international phone number validation
        if (!phoneRegex.test(data)) {
          return 'Please enter a valid phone number.'
        }
        return true
      },
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Vendor', value: 'vendor' },
        { label: 'Shop Attendant', value: 'shop_attendant' },
      ],
      defaultValue: 'vendor',
    },
    {
      name: 'rolePermissions',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'User & Shop Management', value: 'user_shop_management' },
        {
          label: 'Product, Service & Inventory Management',
          value: 'product_service_inventory_management',
        },
        { label: 'Sales & Orders', value: 'sales_orders' },
        { label: 'Refunds', value: 'refunds' },
        { label: 'Expense Management', value: 'expense_management' },
        { label: 'Reporting', value: 'reporting' },
        { label: 'Transactions', value: 'transactions' },
      ],
    },
  ],
}
