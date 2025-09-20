'use client'

import { useState } from 'react'

export default function TestSentryPage() {
  const [loading, setLoading] = useState(false)
  const [serverLoading, setServerLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const triggerClientError = () => {
    // This will trigger a client-side error
    throw new Error('Test client-side error for Sentry!')
  }

  const triggerServerError = async () => {
    setServerLoading(true)
    setResult('')

    try {
      const captureType =
        document.querySelector<HTMLSelectElement>('#captureType')?.value || 'manual'
      const response = await fetch(`/api/test-sentry-error?type=${captureType}`)
      const text = await response.text()

      setResult(`Server Response: ${text}`)
    } catch (error) {
      setResult(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setServerLoading(false)
    }
  }

  const triggerAsyncError = async () => {
    setLoading(true)
    setResult('')

    try {
      // Simulate an async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Test async error for Sentry!'))
        }, 1000)
      })
    } catch (error) {
      setResult(`Async error caught: ${error}`)
      // Re-throw to let Sentry capture it
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '50px auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>Sentry Error Testing</h1>
      <p>Use these buttons to test different types of Sentry error capturing:</p>

      <div style={{ marginBottom: '20px' }}>
        <h3>1. Client-side Error</h3>
        <button
          onClick={triggerClientError}
          style={{
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px',
          }}
        >
          Trigger Client Error
        </button>
        <small>This will throw an error directly in the browser.</small>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>2. Server-side Error</h3>

        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="captureType" style={{ marginRight: '10px' }}>
            Capture Method:
          </label>
          <select
            id="captureType"
            style={{
              padding: '5px',
              borderRadius: '3px',
              border: '1px solid #ccc',
            }}
          >
            <option value="manual">Manual Capture (with context)</option>
            <option value="auto">Auto Capture (just throw)</option>
          </select>
        </div>

        <button
          onClick={triggerServerError}
          disabled={serverLoading}
          style={{
            backgroundColor: '#ff8800',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: serverLoading ? 'not-allowed' : 'pointer',
            marginRight: '10px',
            opacity: serverLoading ? 0.6 : 1,
          }}
        >
          {serverLoading ? 'Loading...' : 'Trigger Server Error'}
        </button>
        <small>Compare manual vs automatic error capturing.</small>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>3. Async Error</h3>
        <button
          onClick={triggerAsyncError}
          disabled={loading}
          style={{
            backgroundColor: '#8800ff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Loading...' : 'Trigger Async Error'}
        </button>
        <small>This will trigger an async error after a delay.</small>
      </div>

      {result && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '5px',
          }}
        >
          <h4>Result:</h4>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result}</pre>
        </div>
      )}

      <div
        style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '5px',
        }}
      >
        <h4>Notes:</h4>
        <ul>
          <li>Sentry is currently configured to only run in production on Vercel</li>
          <li>To test locally, you may need to temporarily modify the instrumentation.ts file</li>
          <li>Check your Sentry dashboard for captured errors</li>
          <li>This page is for testing purposes only - remove it in production</li>
        </ul>
      </div>
    </div>
  )
}
