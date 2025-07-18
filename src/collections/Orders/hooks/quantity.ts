import { FieldHook } from 'payload'

export const validateQuantity: FieldHook = async ({ siblingData, operation }) => {
  if (operation === 'create') {
    const value = siblingData?.quantity
    if (!value || value <= 0) {
      return 'Quantity must be greater than zero.'
    }
  }
}
