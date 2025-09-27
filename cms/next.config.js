import { withPayload } from '@payloadcms/next/withPayload'
// Injected content via Sentry wizard below
import { withSentryConfig } from '@sentry/nextjs'
import redirects from './redirects.js'

// Helper function to clean environment variables (remove extra quotes)
const cleanEnvVar = (envVar) => {
  if (!envVar) return envVar
  return envVar.replace(/^["']|["']$/g, '').trim()
}

const NEXT_PUBLIC_SERVER_URL =
  cleanEnvVar(process.env.NEXT_PUBLIC_SERVER_URL) ||
  (process.env.VERCEL_URL ? `https://${cleanEnvVar(process.env.VERCEL_URL)}` : null) ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${cleanEnvVar(process.env.VERCEL_PROJECT_PRODUCTION_URL)}`
    : null) ||
  cleanEnvVar(process.env.__NEXT_PRIVATE_ORIGIN) ||
  'http://localhost:3000'

// Allow images from multiple domains to handle staging/production
const allowedImageDomains = [
  NEXT_PUBLIC_SERVER_URL,
  // Explicit staging domain
  'https://konto-env-staging-ui-ninjas-projects.vercel.app',
  'https://staging.usehoga.com',
  'https://usehoga.com',
  // Explicit production domain
  'https://konto-ruddy.vercel.app',
  // Localhost for development
  'http://localhost:3000',
  'http://192.168.0.160:3000',
].filter(Boolean).map(cleanEnvVar)

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Allow all vercel.app subdomains (catches any preview deployments)
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      // Allow specific domains
      ...allowedImageDomains.map((item) => {
        try {
          const url = new URL(item)
          return {
            hostname: url.hostname,
            protocol: url.protocol.replace(':', ''),
          }
        } catch (error) {
          console.error(`Failed to parse URL: "${item}"`, error)
          // Return a fallback that won't break the build
          return {
            hostname: 'localhost',
            protocol: 'http',
          }
        }
      }),
    ],
    // Configure quality values to avoid Next.js 16 warnings
    qualities: [75, 100],
    // Configure local patterns for query strings
    localPatterns: [
      {
        pathname: '/media/**',
        search: '',
      },
      {
        pathname: '/api/media/file/**',
        search: '',
      },
      {
        pathname: '/**',
        search: '',
      },
    ],
  },
  webpack: (webpackConfig, { dev, isServer }) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withSentryConfig(withPayload(nextConfig, { devBundleServerPackages: false }), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'kontoapp',
  project: 'konto-cms',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enable automatic instrumentation for server functions
  autoInstrumentServerFunctions: true,

  // Disable Vercel Cron monitoring to reduce dependencies
  automaticVercelMonitors: false,
})
