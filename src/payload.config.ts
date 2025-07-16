import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from '@collections/Users'
import { Media } from '@collections/Media'
import { Shops } from '@collections/Shops'
import { Batches } from '@collections/Batches'
import Products from '@collections/Products'
import Categories from '@collections/Categories'
import Stock from '@collections/Stocks'
import Suppliers from '@collections/Suppliers'
import { Services } from '@collections/Services'
import Customers from '@collections/Customers'
import { Orders } from '@collections/Orders'
import { moveStock } from '@/endpoints/moveStock'


const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const dbUrl =
  process.env.NODE_ENV == 'test' ? process.env.DATABASE_URI_TEST : process.env.DATABASE_URI
export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Shops,
    Batches,
    Products,
    Categories,
    Stock,
    Suppliers,
    Customers,
    Services,
    Orders,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: dbUrl || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
  ],
  endpoints: [moveStock],
})
