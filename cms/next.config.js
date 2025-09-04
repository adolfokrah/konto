import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  process.env.__NEXT_PRIVATE_ORIGIN || 
  'http://localhost:3000'

// Allow images from multiple domains to handle staging/production
const allowedImageDomains = [
  NEXT_PUBLIC_SERVER_URL,
  // Explicit staging domain
  'https://konto-env-staging-ui-ninjas-projects.vercel.app',
  // Explicit production domain  
  'https://konto-ruddy.vercel.app',
  // Localhost for development
  'http://localhost:3000',
].filter(Boolean)

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
        const url = new URL(item)
        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
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

export default withPayload(nextConfig, { devBundleServerPackages: false })
