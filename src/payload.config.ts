// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import dotenv from 'dotenv'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Shops } from './collections/Shops'
import { Batches } from './collections/Batches'
import Products from './collections/Products'
import Categories from './collections/Categories'
import Stock from './collections/Stock'
import Suppliers from './collections/Suppliers'
import { moveStock } from './endpoints/moveStock'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Only load test env for test runs
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test', override: true })
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Shops, Batches, Products, Categories, Stock, Suppliers],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
  endpoints: [moveStock],
})
