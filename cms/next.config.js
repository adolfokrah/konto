import { withPayload } from '@payloadcms/next/withPayload'
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
  'https://staging.hogapay.com',
  'https://hogapay.com',
  // Explicit production domain
  'https://konto-ruddy.vercel.app',
  // Localhost for development
  'http://localhost:3000',
  'http://192.168.0.160:3000',
]
  .filter(Boolean)
  .map(cleanEnvVar)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set the output file tracing root to silence workspace warning
  outputFileTracingRoot: process.cwd(),
  // Mark Payload packages for transpilation so Turbopack/Next can handle their CSS/SCSS imports
  transpilePackages: [
    '@payloadcms/richtext-lexical',
    '@payloadcms/plugin-seo',
    '@payloadcms/plugin-search',
    '@payloadcms/storage-s3',
  ],
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

    // Ignore CSS and SCSS imports in server-side builds for PayloadCMS
    if (isServer) {
      webpackConfig.module.rules.push({
        test: /\.(css|scss|sass)$/,
        use: 'null-loader',
        include: /node_modules\/@payloadcms/,
      })
    }

    // // Memory optimizations for large builds
    // if (!dev) {
    //   webpackConfig.optimization = {
    //     ...webpackConfig.optimization,
    //     splitChunks: {
    //       ...webpackConfig.optimization.splitChunks,
    //       maxSize: 240000, // Smaller chunks to reduce memory usage
    //     },
    //   }
    // }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
