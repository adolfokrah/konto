import type { CollectionAfterChangeHook } from 'payload'

export const generatePaymentLink: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  // Payment link generation is no longer needed
  // The payment link is now generated dynamically on the frontend
  // This hook is kept for future payment-related logic if needed
}
