import type { CollectionConfig } from 'payload'

export const Shops: CollectionConfig = {
  slug: 'shops',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      filterOptions: (data: any) => {
        // Filter to show only users with the 'vendor' role
        return {
          role: {
            equals: 'vendor',
          },
        }
      },
    },
    {
      name: 'shopType',
      type: 'select',
      options: [
        { label: 'Retail', value: 'retail' },
        { label: 'Wholesale', value: 'wholesale' },
        { label: 'Service', value: 'service' },
      ],
    },
    {
      name: 'shopCategory',
      type: 'select',
      options: [
        { label: 'Grocery', value: 'grocery' },
        { label: 'Electronics', value: 'electronics' },
        { label: 'Clothing', value: 'clothing' },
        { label: 'Pharmacy', value: 'pharmacy' },
        { label: 'Hardware', value: 'hardware' },
        { label: 'Furniture', value: 'furniture' },
        { label: 'Automotive', value: 'automotive' },
        { label: 'Beauty & Personal Care', value: 'beauty_personal_care' },
        { label: 'Sports & Outdoors', value: 'sports_outdoors' },
        { label: 'Toys & Games', value: 'toys_games' },
        { label: 'Books & Stationery', value: 'books_stationery' },
        { label: 'Pet Supplies', value: 'pet_supplies' },
        { label: 'Home & Garden', value: 'home_garden' },
        { label: 'Health & Wellness', value: 'health_wellness' },
        { label: 'Babering', value: 'barbering' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      options: [
        { label: 'Ghanaian Cedi (GHS)', value: 'GHS' },
        { label: 'US Dollar (USD)', value: 'USD' },
        { label: 'Euro (EUR)', value: 'EUR' },
        { label: 'British Pound (GBP)', value: 'GBP' },
        { label: 'Nigerian Naira (NGN)', value: 'NGN' },
        { label: 'South African Rand (ZAR)', value: 'ZAR' },
        // Add more currencies as needed
      ],
      defaultValue: 'GHS', // Default to Ghanaian Cedi
    },
    {
      name: 'countryCode',
      type: 'text',
      required: true,
      defaultValue: '+233', // Default to Ghana's country code
    },
    {
      name: 'contactNumber',
      type: 'text',
      required: true,
      validate: (data: any) => {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/ // Basic international phone number validation
        if (!phoneRegex.test(data)) {
          return 'Please enter a valid contact number.'
        }
        return true
      },
    },
  ],
}
