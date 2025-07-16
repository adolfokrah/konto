export const validateQuantity = (value: number | null | undefined) => {
  if (!value || value <= 0) {
    return 'Quantity must be greater than zero.'
  }
  return true
}
