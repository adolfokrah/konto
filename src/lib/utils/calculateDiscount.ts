export const calculateDiscount = (
  discount: number,
  discountType: 'percentage' | 'fixed',
  totalAmount: number,
) => {
  if (discountType === 'percentage') {
    return (discount / 100) * totalAmount
  } else if (discountType === 'fixed') {
    return discount
  }
  return 0
}
