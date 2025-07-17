import { calculateDiscount } from '@/lib/utils/calculateDiscount'
import { Expense } from '@/payload-types'

import { APIError, type FieldHook } from 'payload'

export const validateAmountPaid: FieldHook = async ({ siblingData }) => {
  const orderItems = siblingData?.items as Expense['items']

  // Calculate total from items (cost * quantity for each item) or use amount for non-inventory expenses
  let totalAmount = 0

  if (orderItems && orderItems.length > 0) {
    // For inventory expenses, calculate total from items
    totalAmount = orderItems.reduce((acc, item) => {
      return acc + item.cost * item.quantity
    }, 0)
  } else {
    // For non-inventory expenses, use the amount field
    totalAmount = siblingData?.amount || 0
  }

  // Apply discount if present
  totalAmount =
    totalAmount -
    calculateDiscount(siblingData?.discount || 0, siblingData?.disountType, totalAmount)

  if (siblingData.amountPaid > totalAmount) {
    throw new APIError(`Amount paid cannot be greater than order amount of ${totalAmount}`, 400)
  } else if (siblingData.amountPaid === totalAmount) {
    siblingData.payment = 'paid'
  }
}
