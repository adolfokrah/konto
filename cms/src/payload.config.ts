// storage-adapter-import-placeholder
import path from 'path'
import { fileURLToPath } from 'url'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { uploadthingStorage } from '@payloadcms/storage-uploadthing'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import Paystack from '@/lib/utils/paystack'
import { Contributions } from '@collections/Contributions'
import { Jars } from '@collections/Jars'
import { Media } from '@collections/Media'
import { Users } from '@collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const dbUrl =
  process.env.NODE_ENV == 'test' ? process.env.DATABASE_URI_TEST : process.env.DATABASE_URI

export const paystack = new Paystack({ secretKey: process.env.PAYSTACK_SECRET! })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Jars, Contributions],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: dbUrl || 'mongodb://localhost:27017/konto',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // Only add UploadthingStorage plugin if UPLOADTHING_TOKEN is available
    ...(process.env.UPLOADTHING_TOKEN
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
})
