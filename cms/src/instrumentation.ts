import * as Sentry from '@sentry/nextjs'

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side configuration
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
      environment: process.env.NODE_ENV,
      // Configure integrations to avoid OpenTelemetry issues
      integrations: (defaultIntegrations) => {
        return defaultIntegrations.filter((integration) => {
          // Remove problematic integrations that use dynamic imports
          return (
            !integration.name.includes('Postgres') &&
            !integration.name.includes('Prisma') &&
            !integration.name.includes('GraphQL') &&
            !integration.name.includes('Apollo') &&
            !integration.name.includes('Connect') &&
            !integration.name.includes('Express') &&
            !integration.name.includes('Fastify') &&
            !integration.name.includes('Koa') &&
            !integration.name.includes('Hapi')
          )
        })
      },
      // Disable auto-discovery of database connections
      skipOpenTelemetrySetup: true,
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime configuration
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      debug: false,
      environment: process.env.NODE_ENV,
      // Edge runtime has fewer integrations, but still filter out problematic ones
      integrations: (defaultIntegrations) => {
        return defaultIntegrations.filter((integration) => {
          // Remove any problematic integrations for edge runtime
          return (
            !integration.name.includes('Postgres') &&
            !integration.name.includes('Prisma') &&
            !integration.name.includes('GraphQL')
          )
        })
      },
      // Disable auto-discovery for edge runtime
      skipOpenTelemetrySetup: true,
    })
  }
}

// Add the onRequestError hook to capture request errors
export async function onRequestError(
  err: unknown,
  request: {
    url?: string
    method?: string
    path?: string
    headers?: Record<string, string | string[]>
  },
  context?: { routerKind?: string; routePath?: string; routeType?: string },
) {
  // Construct proper RequestInfo for Sentry
  const requestInfo = {
    url: request.url || '',
    method: request.method || 'GET',
    path: request.path || request.url || '',
    headers: request.headers || {},
  }

  // Provide proper ErrorContext with required routeType
  const errorContext = {
    routeType: context?.routeType || 'unknown',
    routerKind: context?.routerKind || 'unknown',
    routePath: context?.routePath || request.path || request.url || '',
  }

  await Sentry.captureRequestError(err, requestInfo, errorContext)
}
