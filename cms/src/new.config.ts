// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import { resendAdapter } from '@payloadcms/email-resend'

import { Categories } from './collections/Categories'
import { Media } from '@collections/Media'
import { Pages } from '@collections/Pages'
import { Posts } from '@collections/Posts'
import { Users } from '@collections/Users'
import { Contributions } from '@collections/Contributions'
import { Jars } from '@collections/Jars'

import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { s3Storage } from '@payloadcms/storage-s3'
import { Resend } from 'resend'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const dbUrl =
  process.env.NODE_ENV == 'test' ? process.env.DATABASE_URI_TEST : process.env.DATABASE_URI

export const resend = new Resend(process.env.RESEND_API_KEY)

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
    ...(process.env.ACCESS_KEY_ID &&
    process.env.SECRET_ACCESS_KEY &&
    process.env.NODE_ENV !== 'test'
      ? [
          s3Storage({
            collections: {
              media: true,
            },
            bucket: process.env.BUCKET || process.env.RAILWAY_BUCKET_NAME || '',
            config: {
              credentials: {
                accessKeyId: process.env.ACCESS_KEY_ID || '',
                secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
              },
              region: process.env.REGION || 'us-east-1',
              endpoint: process.env.ENDPOINT,
              forcePathStyle: false,
            },
          }),
        ]
      : []),
  ],
  secret: process.env.PAYLOAD_SECRET || 'SECRET_KEY',
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
  localization: {
    locales: ['en', 'fr'], // required
    defaultLocale: 'en', // required
  },
  email: resendAdapter({
    defaultFromAddress: 'dev@payloadcms.com',
    defaultFromName: 'Payload CMS',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
})
