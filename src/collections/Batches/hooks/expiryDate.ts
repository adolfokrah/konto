import { type FieldHook } from 'payload'

export const validateExpiryDate: FieldHook = async ({ data, operation }) => {
  if (operation === 'create' && new Date(data?.expiryDate) < new Date()) {
    throw new Error('Expiry date cannot be in the past.')
  }
}
