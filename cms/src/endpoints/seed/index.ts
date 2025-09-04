import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'
import path from 'path'
import fs from 'fs'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { image3 } from './image-3'
import { imageHero1 } from './image-hero-1'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'posts',
  'forms',
  'form-submissions',
  'search',
]
const globals: GlobalSlug[] = ['header', 'footer']

// Helper function to create media with retry logic for UploadThing failures
async function createMediaWithRetry(
  payload: Payload,
  collection: CollectionSlug,
  data: any,
  file: File,
  fileName: string,
  maxRetries: number = 3,
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      payload.logger.info(`Attempting to upload ${fileName} (attempt ${attempt}/${maxRetries})`)

      const result = await payload.create({
        collection,
        data,
        file,
      })

      payload.logger.info(`Successfully uploaded ${fileName}`)
      return result
    } catch (error) {
      payload.logger.error(`Upload attempt ${attempt} failed for ${fileName}:`, error)

      if (attempt === maxRetries) {
        payload.logger.error(`All ${maxRetries} attempts failed for ${fileName}`)
        throw error
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000
      payload.logger.info(`Waiting ${delay}ms before retry...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all(
    globals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: {
          navItems: [],
        },
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      }),
    ),
  )

  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  payload.logger.info(`— Seeding demo author and user...`)

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        equals: 'demo-author@example.com',
      },
    },
  })

  payload.logger.info(`— Seeding media...`)

  let image1Buffer: File, image2Buffer: File, image3Buffer: File, hero1Buffer: File

  try {
    ;[image1Buffer, image2Buffer, image3Buffer, hero1Buffer] = await Promise.all([
      fetchLocalFile(path.join(__dirname, 'image-post1.webp')),
      fetchLocalFile(path.join(__dirname, 'image-post2.webp')),
      fetchLocalFile(path.join(__dirname, 'image-post3.webp')),
      fetchLocalFile(path.join(__dirname, 'image-hero1.webp')),
    ])
  } catch (error) {
    payload.logger.error('Failed to load local image files, falling back to remote URLs...')
    console.error('Local file error:', error)

    // Fallback to remote URLs with individual error handling
    const imagePromises: Promise<File>[] = [
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post1.webp',
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post2.webp',
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp',
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp',
    ].map(async (url) => {
      try {
        return await fetchFileByURL(url)
      } catch (urlError) {
        payload.logger.error(`Failed to fetch ${url}:`, urlError)
        throw urlError
      }
    })

    const results = await Promise.all(imagePromises)
    image1Buffer = results[0]
    image2Buffer = results[1]
    image3Buffer = results[2]
    hero1Buffer = results[3]
  }

  const [demoAuthor, image1Doc, image2Doc, image3Doc, imageHomeDoc] = await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        fullName: 'Demo Author',
        email: 'demo-author@example.com',
        password: 'password',
        phoneNumber: '+1234567890',
        country: 'us',
      },
    }),
    createMediaWithRetry(payload, 'media', image1, image1Buffer, 'image-post1.webp'),
    createMediaWithRetry(payload, 'media', image2, image2Buffer, 'image-post2.webp'),
    createMediaWithRetry(payload, 'media', image3, image3Buffer, 'image-post3.webp'),
    createMediaWithRetry(payload, 'media', imageHero1, hero1Buffer, 'image-hero1.webp'),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Technology',
        breadcrumbs: [
          {
            label: 'Technology',
            url: '/technology',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'News',
        breadcrumbs: [
          {
            label: 'News',
            url: '/news',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Finance',
        breadcrumbs: [
          {
            label: 'Finance',
            url: '/finance',
          },
        ],
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'Design',
        breadcrumbs: [
          {
            label: 'Design',
            url: '/design',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Software',
        breadcrumbs: [
          {
            label: 'Software',
            url: '/software',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Engineering',
        breadcrumbs: [
          {
            label: 'Engineering',
            url: '/engineering',
          },
        ],
      },
    }),
  ])

  payload.logger.info(`— Seeding posts...`)

  // Do not create posts with `Promise.all` because we want the posts to be created in order
  // This way we can sort them by `createdAt` or `publishedAt` and they will be in the expected order
  const post1Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post1({ heroImage: image1Doc, blockImage: image2Doc, author: demoAuthor }),
  })

  const post2Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post2({ heroImage: image2Doc, blockImage: image3Doc, author: demoAuthor }),
  })

  const post3Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post3({ heroImage: image3Doc, blockImage: image1Doc, author: demoAuthor }),
  })

  // update each post with related posts
  await payload.update({
    id: post1Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post2Doc.id, post3Doc.id],
    },
  })
  await payload.update({
    id: post2Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post1Doc.id, post3Doc.id],
    },
  })
  await payload.update({
    id: post3Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post1Doc.id, post2Doc.id],
    },
  })

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData,
  })

  payload.logger.info(`— Seeding pages...`)

  const [_, contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      data: home({ heroImage: imageHomeDoc, metaImage: image2Doc }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData({ contactForm: contactForm }),
    }),
  ])

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Posts',
              url: '/posts',
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Contact',
              reference: {
                relationTo: 'pages',
                value: contactPage.id,
              },
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/main/templates/website',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Payload',
              newTab: true,
              url: 'https://payloadcms.com/',
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function fetchLocalFile(filePath: string): Promise<File> {
  const data = await fs.promises.readFile(filePath)
  const fileName = path.basename(filePath)
  const fileExtension = path.extname(filePath).slice(1)

  return {
    name: fileName,
    data: data,
    mimetype: `image/${fileExtension}`,
    size: data.byteLength,
  }
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
