import { afterEach, describe, expect, it } from 'vitest'

import { apiMediaUrl } from '@/utilities/apiMediaUrl'

describe('apiMediaUrl', () => {
  const original = process.env.NEXT_PUBLIC_API_URL
  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = original
  })

  it('serves relative media from the API host', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://hoga-production.up.railway.app/api'
    expect(apiMediaUrl('/api/media/file/jar.jpg')).toBe(
      'https://hoga-production.up.railway.app/api/media/file/jar.jpg',
    )
  })

  it('leaves absolute URLs alone', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://hoga-production.up.railway.app/api'
    expect(apiMediaUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
  })

  it('returns null for missing media and keeps the path if the API URL is unset', () => {
    expect(apiMediaUrl(null)).toBeNull()
    process.env.NEXT_PUBLIC_API_URL = ''
    expect(apiMediaUrl('/api/media/file/jar.jpg')).toBe('/api/media/file/jar.jpg')
  })
})
