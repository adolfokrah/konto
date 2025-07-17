import { calculateDiscount } from '@/lib/utils/calculateDiscount'
import { Expense } from '@/payload-types'

import { APIError, type FieldHook } from 'payload'

export const validateAmountPaid: FieldHook = async ({ siblingData }) => {
  const orederItems = siblingData?.items as Expense['items']
  const items = orederItems?.map(item => item.cost) || []

  let totalAmount = items.reduce((acc, item) => acc + item, 0)
  totalAmount =
    totalAmount -
    calculateDiscount(siblingData?.discount || 0, siblingData?.disountType, totalAmount)

  if (siblingData.amountPaid > (totalAmount || siblingData?.amount)) {
    throw new APIError(
      `Amount paid cannot be greater than order amount of ${totalAmount || siblingData?.amount}`,
      400
    )
  } else if (siblingData.amountPaid == totalAmount) {
    siblingData.payment = 'paid'
  }
}
