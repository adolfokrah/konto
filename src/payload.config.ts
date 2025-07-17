import { moveStock } from '@/endpoints/moveStock'
import { Batches } from '@collections/Batches'
import Categories from '@collections/Categories'
import Customers from '@collections/Customers'
import Expenses from '@collections/Expenses'
import { Media } from '@collections/Media'
import { Orders } from '@collections/Orders'
import Products from '@collections/Products'
import { Services } from '@collections/Services'
import { Shops } from '@collections/Shops'
import Stock from '@collections/Stocks'
import Suppliers from '@collections/Suppliers'
import { Users } from '@collections/Users'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

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
    Expenses,
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
  plugins: [payloadCloudPlugin()],
  endpoints: [moveStock],
})
