/**
 * Didit KYC Service
 *
 * This service handles KYC (Know Your Customer) verification sessions using Didit API.
 * It provides functionality to create verification sessions for users to complete
 * their identity verification process.
 *
 * @see https://docs.didit.me/reference/create-session-verification-sessions
 */

interface CreateSessionRequest {
  workflow_id: string
  vendor_data: string // Usually user ID or identifier
  callback?: string // Optional callback URL
  language?: string // Optional language code
  redirect_url?: string // Optional redirect URL after completion
  metadata?: Record<string, any> // Optional metadata for additional data
  contact_details?: {
    email?: string
    email_lang?: string
    phone?: string
  }
  expected_details?: {
    first_name?: string
    last_name?: string
    date_of_birth?: string
    nationality?: string
    document_type?: string
    document_number?: string
    address?: string
    [key: string]: any // Allow additional expected fields
  }
}

interface CreateSessionResponse {
  session_id: string
  session_token: string
  verification_url: string
  status: string
}

// Didit API session status types
export type DiditSessionStatus =
  | 'Not Started'
  | 'In Progress'
  | 'In Review'
  | 'Approved'
  | 'Declined'
  | 'Abandoned'

// Didit webhook event types
export type DiditWebhookType = 'status.updated' | 'data.updated'

interface SessionStatus {
  session_id: string
  status: DiditSessionStatus
  created_at: string
  updated_at: string
  expires_at: string
  vendor_data: string
  workflow_id: string
  verification_url?: string
}

// Webhook payload interface
export interface DiditWebhookPayload {
  session_id: string
  status: DiditSessionStatus
  webhook_type: DiditWebhookType
  created_at: number
  timestamp: number
  workflow_id: string
  vendor_data?: string
  metadata?: Record<string, any>
  decision?: {
    session_id: string
    status: string
    id_verification?: {
      status: 'Approved' | 'Declined'
      first_name?: string
      last_name?: string
      full_name?: string
      date_of_birth?: string
      document_type?: string
      // ... other fields as needed
    }
    // ... other verification types
  }
}

interface DiditError {
  error: string
  message: string
  status_code: number
}

export class DiditKYC {
  private readonly apiKey: string
  private readonly workflowId: string
  private readonly baseUrl = 'https://verification.didit.me/v3'

  constructor(apiKey: string, workflowId: string) {
    if (!apiKey) {
      throw new Error('DIDIT_KYC_API_KEY is required')
    }
    if (!workflowId) {
      throw new Error('DIDIT_WORKFLOW_ID is required')
    }

    this.apiKey = apiKey
    this.workflowId = workflowId
  }

  /**
   * Create a new KYC verification session for a user
   *
   * @param vendorData - Unique identifier for the user (e.g., user ID)
   * @param options - Optional parameters for session creation
   * @returns Promise containing session information including verification URL
   */
  async createSession(
    vendorData: string,
    options: {
      callbackUrl?: string
      language?: string
      redirectUrl?: string
      metadata?: Record<string, any>
      contactDetails?: {
        email?: string
        emailLang?: string
        phone?: string
      }
      expectedDetails?: {
        fullName?: string
        dateOfBirth?: string
        nationality?: string
        documentType?: string
        documentNumber?: string
        address?: string
        [key: string]: any
      }
    } = {},
  ): Promise<CreateSessionResponse> {
    const requestBody: CreateSessionRequest = {
      workflow_id: this.workflowId,
      vendor_data: vendorData,
      ...(options.callbackUrl && { callback: options.callbackUrl }),
      ...(options.language && { language: options.language }),
      ...(options.redirectUrl && { redirect_url: options.redirectUrl }),
      ...(options.metadata && { metadata: options.metadata }),
      ...(options.contactDetails && {
        contact_details: {
          ...(options.contactDetails.email && { email: options.contactDetails.email }),
          ...(options.contactDetails.emailLang && { email_lang: options.contactDetails.emailLang }),
          ...(options.contactDetails.phone && { phone: options.contactDetails.phone }),
        },
      }),
      ...(options.expectedDetails && {
        expected_details: {
          ...(options.expectedDetails.fullName && { full_name: options.expectedDetails.fullName }),
          ...(options.expectedDetails.dateOfBirth && {
            date_of_birth: options.expectedDetails.dateOfBirth,
          }),
          ...(options.expectedDetails.nationality && {
            nationality: options.expectedDetails.nationality,
          }),
          ...(options.expectedDetails.documentType && {
            document_type: options.expectedDetails.documentType,
          }),
          ...(options.expectedDetails.documentNumber && {
            document_number: options.expectedDetails.documentNumber,
          }),
          ...(options.expectedDetails.address && { address: options.expectedDetails.address }),
          // Include any additional fields
          ...Object.fromEntries(
            Object.entries(options.expectedDetails).filter(
              ([key]) =>
                ![
                  'fullName',
                  'dateOfBirth',
                  'nationality',
                  'documentType',
                  'documentNumber',
                  'address',
                ].includes(key),
            ),
          ),
        },
      }),
    }

    try {
      const response = await fetch(`${this.baseUrl}/session/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const responseText = await response.text()
        console.error(`Didit API error response (${response.status}):`, responseText)
        try {
          const errorData = JSON.parse(responseText)
          throw new Error(
            `Didit API error (${response.status}): ${errorData.message || errorData.detail || responseText}`,
          )
        } catch (parseError) {
          throw new Error(`Didit API error (${response.status}): ${responseText}`)
        }
      }

      const sessionData: CreateSessionResponse = await response.json()
      return sessionData
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create Didit KYC session: ${error.message}`)
      }
      throw new Error('Failed to create Didit KYC session: Unknown error')
    }
  }

  /**
   * Retrieve the status and details of a KYC verification session
   *
   * @param sessionId - The session ID returned from createSession
   * @returns Promise containing session status and details
   */
  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    try {
      const url = `${this.baseUrl}/session/${sessionId}/decision/`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-api-key': this.apiKey,
        },
      })
      if (!response.ok) {
        const responseText = await response.text()

        console.log(responseText)

        // Try to parse as JSON, fallback to text if not JSON
        try {
          const errorData: DiditError = JSON.parse(responseText)
          throw new Error(`Didit API error (${errorData.status_code}): ${errorData.message}`)
        } catch (parseError) {
          throw new Error(`Didit API error (${response.status}): ${responseText}`)
        }
      }

      const responseText = await response.text()
      console.log(`✅ Success response body:`, responseText)

      const sessionData: SessionStatus = JSON.parse(responseText)
      return sessionData
    } catch (error) {
      console.error('🚨 getSessionStatus error:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to get session status: ${error.message}`)
      }
      throw new Error('Failed to get session status: Unknown error')
    }
  }

  /**
   * Delete/cancel a KYC verification session
   *
   * @param sessionId - The session ID to delete
   * @returns Promise that resolves when session is deleted
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    try {
      const response = await fetch(`${this.baseUrl}/session/${sessionId}/`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'x-api-key': this.apiKey,
        },
      })

      if (!response.ok) {
        const errorData: DiditError = await response.json()
        throw new Error(`Didit API error (${errorData.status_code}): ${errorData.message}`)
      }
    } catch (error) {
      console.log(error)

      if (error instanceof Error) {
        throw new Error(`Failed to delete session: ${error.message}`)
      }
      throw new Error('Failed to delete session: Unknown error')
    }
  }

  /**
   * List all sessions for the current workflow
   *
   * @param limit - Maximum number of sessions to return (default: 50)
   * @param offset - Number of sessions to skip for pagination (default: 0)
   * @returns Promise containing array of session data
   */
  async listSessions(limit: number = 50, offset: number = 0): Promise<SessionStatus[]> {
    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })

      const response = await fetch(`${this.baseUrl}/session/?${queryParams}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-api-key': this.apiKey,
        },
      })

      if (!response.ok) {
        const errorData: DiditError = await response.json()
        throw new Error(`Didit API error (${errorData.status_code}): ${errorData.message}`)
      }

      const sessionsData: SessionStatus[] = await response.json()
      return sessionsData
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list sessions: ${error.message}`)
      }
      throw new Error('Failed to list sessions: Unknown error')
    }
  }
}

/**
 * Factory function to create a DiditKYC instance with direct API keys
 *
 * @returns DiditKYC instance configured with API keys
 */
export function createDiditKYC(): DiditKYC {
  // Set your Didit API keys directly here
  const apiKey = process.env.DIDIT_KYC_API_KEY || 'YOUR_DIDIT_API_KEY_HERE'
  const workflowId = process.env.DIDIT_WORKFLOW_ID || 'YOUR_DIDIT_WORKFLOW_ID_HERE'

  return new DiditKYC(apiKey, workflowId)
}

/**
 * Helper function to check if a session status indicates completion
 *
 * @param status - Session status to check
 * @returns True if session is completed successfully
 */
export function isSessionCompleted(status: SessionStatus['status']): boolean {
  return status === 'Approved'
}

/**
 * Helper function to check if a session status indicates failure
 *
 * @param status - Session status to check
 * @returns True if session has failed, declined, or abandoned
 */
export function isSessionFailed(status: SessionStatus['status']): boolean {
  return status === 'Declined' || status === 'Abandoned'
}

/**
 * Helper function to check if a session is still pending
 *
 * @param status - Session status to check
 * @returns True if session is still pending/in-progress
 */
export function isSessionPending(status: SessionStatus['status']): boolean {
  return status === 'Not Started' || status === 'In Progress' || status === 'In Review'
}
