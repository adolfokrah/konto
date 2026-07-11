import canUseDOM from './canUseDOM'

export const getServerSideURL = () => {
  let url = process.env.NEXT_PUBLIC_SERVER_URL

  // For Vercel deployments, prioritize preview URLs for non-production environments
  if (!url && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (!url && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (!url) {
    url = 'http://localhost:3000'
  }

  return url
}

/**
 * Base URL used for Eganow webhook/callback URLs.
 * Set WEBHOOK_BASE_URL to a public tunnel (e.g. Cloudflare) when developing locally so
 * Eganow can reach the callback server-side. Falls back to the normal server URL.
 */
export const getWebhookBaseURL = () => {
  return (process.env.WEBHOOK_BASE_URL || getServerSideURL()).replace(/\/+$/, '')
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return process.env.NEXT_PUBLIC_SERVER_URL || ''
}
