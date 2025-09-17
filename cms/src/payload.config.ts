// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from '@collections/Media'
import { Pages } from '@collections/Pages'
import { Posts } from '@collections/Posts'
import { Users } from '@collections/Users'
import Paystack from './utilities/paystack'
import { Contributions } from '@collections/Contributions'
import { Jars } from '@collections/Jars'

import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { uploadthingStorage } from '@payloadcms/storage-uploadthing'
import TransactionCharges from './utilities/transaction-charges'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const dbUrl =
  process.env.NODE_ENV == 'test' ? process.env.DATABASE_URI_TEST : process.env.DATABASE_URI

export const paystack = new Paystack({ secretKey: process.env.PAYSTACK_SECRET! })

// Removed test error throw that was used to verify Sentry integration.
export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: mongooseAdapter({
    url: dbUrl || 'mongodb://localhost:27017/konto',
  }),
  collections: [Pages, Posts, Media, Categories, Users, Contributions, Jars],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  plugins: [
    ...plugins,
    // storage-adapter-placeholder
    // Only add UploadthingStorage plugin if UPLOADTHING_TOKEN is available AND not in test mode
    ...(process.env.UPLOADTHING_TOKEN && process.env.NODE_ENV !== 'test'
      ? [
          uploadthingStorage({
            collections: {
              media: true, // Apply to 'media' collection
            },
            options: {
              token: process.env.UPLOADTHING_TOKEN,
              acl: 'public-read', // This is optional
            },
          }),
        ]
      : []),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
