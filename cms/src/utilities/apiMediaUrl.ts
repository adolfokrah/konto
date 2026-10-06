/**
 * Absolute URL for a media file, served by the API (NEXT_PUBLIC_API_URL's host).
 *
 * Payload returns media as relative paths (/api/media/file/<name>). On a site deployment
 * whose own backend isn't the production API (hogapay.com on Vercel), a relative path would
 * be fetched from that deployment, so pages that load jars through the API also load their
 * images from it.
 */
export function apiMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_API_URL ?? '').origin
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
  } catch {
    return url
  }
}
