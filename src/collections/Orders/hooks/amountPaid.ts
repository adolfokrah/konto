import { type FieldHook, APIError } from 'payload'
import { Order } from '@/payload-types'
import { calculateDiscount } from '@/lib/utils/calculateDiscount'

export const validateAmountPaid: FieldHook = async ({ siblingData }) => {
  const orederItems = siblingData?.items as Order['items']
  const items =
    orederItems
      ?.filter((item) => !item?.isReturned)
      .map((item) => item.quantity * item.unitPrice) || []

  let totalAmount = items.reduce((acc, item) => acc + item, 0)
  totalAmount =
    totalAmount -
    calculateDiscount(siblingData?.discount || 0, siblingData?.disountType, totalAmount)

  if (siblingData.amountPaid > totalAmount) {
    throw new APIError(`Amount paid cannot be greater than order amount of ${totalAmount}`, 400)
  } else if (siblingData.amountPaid == totalAmount) {
    siblingData.payment = 'paid'
  }
}
