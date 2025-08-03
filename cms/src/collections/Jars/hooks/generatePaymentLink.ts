import type { CollectionAfterChangeHook } from 'payload'

export const generatePaymentLink: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  // Generate payment link for newly created jars
  if (operation === 'create' && !doc.paymentLink) {
    // Create URL-friendly version of jar name
    const urlFriendlyName = doc.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    const paymentLink = `https://pay.konto.app/jar/${doc.id}/${urlFriendlyName}`

    // Update the document with the generated payment link
    try {
      const updatedDoc = await req.payload.update({
        collection: 'jars' as any,
        id: doc.id,
        data: { paymentLink },
      })
      // Update the current doc object to reflect the change
      doc.paymentLink = paymentLink
    } catch (error) {
      console.error('Failed to update payment link:', error)
    }
  }
}
