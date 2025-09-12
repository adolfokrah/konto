import type { CollectionAfterChangeHook } from 'payload'

export const generatePaymentLink: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  // Generate payment link for newly created jars
  if (operation === 'create') {
    // Create URL-friendly version of jar name
    const paymentLink = `${process.env.NEXT_PUBLIC_SERVER_URL}/pay/${doc.id}`

    // Update the document with the generated payment link
    try {
      await req.payload.update({
        collection: 'jars',
        id: doc.id,
        data: { paymentPage: { link: paymentLink } },
      })
      // Update the current doc object to reflect the change
      // doc.paymentPage.link = paymentLink
    } catch (error) {
      console.error('Failed to update payment link:', error)
    }
  }
}
