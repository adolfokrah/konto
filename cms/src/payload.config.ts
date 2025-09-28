import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Import collections directly
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Contributions } from './collections/Contributions'
import { Jars } from './collections/Jars'
import { Posts } from './collections/Posts'
import { Pages } from './collections/Pages'
import Paystack from './utilities/paystack'
import { plugins } from './plugins'
import { uploadthingStorage } from '@payloadcms/storage-uploadthing'
import { getServerSideURL } from './utilities/getURL'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { resendAdapter } from '@payloadcms/email-resend'
import { Notifications } from './collections/Notifications'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Export paystack for tests and other modules that need it
export const paystack = new Paystack({ secretKey: process.env.PAYSTACK_SECRET! })

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: 'users',
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
  collections: [Pages, Posts, Media, Categories, Users, Contributions, Jars, Notifications],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  db: mongooseAdapter({
    url:
      process.env.NODE_ENV == 'test'
        ? process.env.DATABASE_URI_TEST || 'mongodb://localhost:27017/test'
        : process.env.DATABASE_URI || 'mongodb://localhost:27017/test',
  }),
  editor: lexicalEditor({}),
  plugins: [
    ...plugins,
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
  secret: process.env.PAYLOAD_SECRET || 'test-secret',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
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

// import { buildConfig } from 'payload'
// import { mongooseAdapter } from '@payloadcms/db-mongodb'
// import { lexicalEditor } from '@payloadcms/richtext-lexical'
// import path from 'path'
// import { fileURLToPath } from 'url'
// import sharp from 'sharp'

// // Import collections directly
// import { Users } from './collections/Users'
// import { Media } from './collections/Media'
// import Paystack from './utilities/paystack'
// import { Resend } from 'resend'

// const filename = fileURLToPath(import.meta.url)
// const dirname = path.dirname(filename)

// export const paystack = new Paystack({ secretKey: process.env.PAYSTACK_SECRET! })
// export const resend = new Resend(process.env.RESEND_API_KEY)

// export default buildConfig({
//   admin: {
//     importMap: {
//       baseDir: path.resolve(dirname),
//     },
//     user: 'users',
//   },
//   collections: [
//     {
//       slug: 'users',
//       auth: true,
//       fields: [
//         {
//           name: 'email',
//           type: 'email',
//           required: true,
//         },
//         {
//           name: 'fcmToken',
//           type: 'text',
//           required: false,
//           admin: {
//             readOnly: true,
//             description: 'Firebase Cloud Messaging token for push notifications',
//           },
//         },
//       ],
//     },
//   ],
//   db: mongooseAdapter({
//     url: process.env.DATABASE_URI || 'mongodb://localhost:27017/test',
//   }),
//   editor: lexicalEditor({}),
//   secret: process.env.PAYLOAD_SECRET || 'test-secret',
//   sharp,
//   typescript: {
//     outputFile: path.resolve(dirname, 'payload-types.ts'),
//   },
// })
