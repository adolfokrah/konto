import type { CollectionAfterChangeHook } from 'payload'

export const generatePaymentLink: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  // Generate payment link for newly created jars
  if (operation === 'create' && !doc.paymentPage?.link) {
    // Create URL-friendly version of jar name
    const urlFriendlyName = doc.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    const paymentLink = `${process.env.NEXT_PUBLIC_SERVER_URL}/jar/${doc.id}/${urlFriendlyName}`

    // Update the document with the generated payment link
    try {
      const _updatedDoc = await req.payload.update({
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
