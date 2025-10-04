import { CollectionAfterChangeHook } from 'payload'
import { emailService } from '@/utilities/emailService'

export const sendWelcomeEmail: CollectionAfterChangeHook = async ({ doc, operation }) => {
  // Only send welcome email for create operations (new user registration)
  if (operation === 'create' && doc.email && doc.fullName) {
    try {
      emailService.sendWelcomeEmail(doc.email, doc.fullName)
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      // Don't throw error to prevent registration failure if email fails
    }
  }
}
