export const validateStockAlert = (data: any) => {
  if (data <= 0) {
    return 'Stock alert must be greater than zero.'
  }
  return true
}
