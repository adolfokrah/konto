import { type FieldHook } from 'payload'
import { Order } from '@/payload-types'
import { calculateDiscount } from '@/lib/utils/calculateDiscount'

export const calculateTotalCost: FieldHook = async ({ siblingData }) => {
  const orederItems = siblingData?.items as Order['items']
  const items =
    orederItems
      ?.filter((item) => !item?.isReturned)
      .map((item) => item.quantity * item.unitPrice) || []
  let totalAmount = items.reduce((acc, item) => acc + item, 0)
  totalAmount =
    totalAmount -
    calculateDiscount(siblingData?.discount || 0, siblingData?.disountType, totalAmount)

  siblingData.totalCost = totalAmount
}
