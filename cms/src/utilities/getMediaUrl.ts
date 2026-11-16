import { getClientSideURL, getServerSideURL } from '@/utilities/getURL'
import canUseDOM from './canUseDOM'
import { apiMediaUrl } from './apiMediaUrl'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return cacheTag ? `${url}?t=${cacheTag}` : url
  }

  // Media files are served by the API. The website deployment (hogapay.com) cannot read
  // the storage bucket itself, so its own /api/media/file route returns 500.
  if (process.env.NEXT_PUBLIC_API_URL) {
    const fullUrl = apiMediaUrl(url) ?? url
    return cacheTag ? `${fullUrl}?t=${cacheTag}` : fullUrl
  }

  // Production fix: Always use consistent URL to prevent SSR/CSR mismatch
  // In production, prioritize NEXT_PUBLIC_SERVER_URL for consistency
  let baseUrl = ''

  if (process.env.NODE_ENV === 'production') {
    // In production, always use the same URL for both server and client
    baseUrl =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : '') ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
      getClientSideURL()
  } else {
    // In development, use the original logic
    baseUrl = canUseDOM ? getClientSideURL() : getServerSideURL()
  }

  const fullUrl = `${baseUrl}${url}`
  return cacheTag ? `${fullUrl}?t=${cacheTag}` : fullUrl
}
