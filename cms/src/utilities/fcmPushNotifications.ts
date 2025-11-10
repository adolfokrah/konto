import admin from 'firebase-admin'

/**
 * Simple FCM Push Notification Service
 */
export class FCMPushNotifications {
  private _messaging: admin.messaging.Messaging | null = null
  private _initialized: boolean = false

  constructor() {
    // Don't initialize Firebase during construction
    // Initialize lazily when messaging is first accessed
  }

  private initializeFirebase() {
    if (this._initialized) return

    try {
      // Check if Firebase Admin is already initialized
      if (!admin.apps || admin.apps.length === 0) {
        // Initialize Firebase Admin with proper credentials
        const firebaseConfig: any = {
          projectId: process.env.FIREBASE_PROJECT_ID || 'hoga-2e89a',
        }

        // Try to use service account key if available
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
          try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            firebaseConfig.credential = admin.credential.cert(serviceAccount)
          } catch (parseError) {
            // Failed to parse service account key, falling back to default credentials
          }
        }

        admin.initializeApp(firebaseConfig)
      }
      this._initialized = true
    } catch (error) {
      // Don't throw error during initialization to prevent build failures
      this._initialized = false
    }
  }

  private get messaging(): admin.messaging.Messaging {
    if (!this._messaging) {
      // Initialize Firebase lazily when first accessed
      this.initializeFirebase()

      if (!this._initialized) {
        throw new Error(
          'Firebase Admin SDK could not be initialized. Please check your configuration.',
        )
      }

      try {
        this._messaging = admin.messaging()
      } catch (error) {
        throw new Error(
          'Firebase Admin SDK not properly initialized. Please check your configuration.',
        )
      }
    }
    return this._messaging
  }

  /**
   * Send push notification to multiple tokens
   * @param tokens - Array of FCM device tokens
   * @param message - Message body text
   * @param title - Notification title
   * @param data - Optional additional data
   */
  async sendNotification(
    tokens: string[],
    message: string,
    title: string,
    data?: Record<string, string>,
  ): Promise<{ success: boolean; successCount: number; failureCount: number }> {
    try {
      if (!tokens || tokens.length === 0) {
        throw new Error('No tokens provided')
      }

      // Filter valid tokens
      const validTokens = tokens.filter((token) => {
        return token && typeof token === 'string' && token.trim().length > 0
      })

      if (validTokens.length === 0) {
        throw new Error('No valid tokens provided')
      }

      // Send notification
      const response = await this.messaging.sendEachForMulticast({
        tokens: validTokens,
        notification: {
          title: title,
          body: message,
        },
        data: data || {},
      })

      // Log detailed results for debugging
      console.log('FCM sendEachForMulticast result:', {
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses.map((r, i) => ({
          index: i,
          success: r.success,
          messageId: r.messageId,
          error: r.error
            ? {
                code: r.error.code,
                message: r.error.message,
                details: JSON.stringify(r.error, null, 2),
              }
            : null,
        })),
      })

      // If there are failures, log full error details
      if (response.failureCount > 0) {
        response.responses.forEach((r, i) => {
          if (!r.success && r.error) {
            console.error(`FCM Error for token ${i}:`, {
              code: r.error.code,
              message: r.error.message,
              fullError: r.error,
            })
          }
        })
      }

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
      }
    } catch (error) {
      console.error('FCM sendNotification error:', error)
      return {
        success: false,
        successCount: 0,
        failureCount: tokens ? tokens.length : 1,
      }
    }
  }
}

// Export singleton instance - safe to instantiate since Firebase init is now lazy
export const fcmNotifications = new FCMPushNotifications()
