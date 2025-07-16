import { calculateDiscount } from '@/lib/utils/calculateDiscount'
import { Order } from '@/payload-types'

import { type FieldHook } from 'payload'

export const calculateTotalCost: FieldHook = async ({ siblingData }) => {
  const orederItems = siblingData?.items as Order['items']
  const items =
    orederItems?.filter(item => !item?.isReturned).map(item => item.quantity * item.unitPrice) || []
  let totalAmount = items.reduce((acc, item) => acc + item, 0)
  totalAmount =
    totalAmount -
    calculateDiscount(siblingData?.discount || 0, siblingData?.disountType, totalAmount)

  siblingData.totalCost = totalAmount
}
