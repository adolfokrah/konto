import { calculateDiscount } from '@/lib/utils/calculateDiscount'
import { Order } from '@/payload-types'

import { type FieldHook } from 'payload'

export const handlePaymentChange: FieldHook = async ({ siblingData }) => {
  if (siblingData?.payment === 'un_paid') {
    siblingData.amountPaid = 0
  }
  if (siblingData?.payment === 'paid') {
    const orederItems = siblingData?.items as Order['items']
    const items = orederItems?.map(item => item.quantity * item.unitPrice) || []

    const totalAmount = items.reduce((acc, item) => acc + item, 0)

    siblingData.amountPaid =
      totalAmount -
      calculateDiscount(siblingData?.discount || 0, siblingData?.disountType, totalAmount)
  }
}
