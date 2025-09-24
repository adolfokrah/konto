/**
 * Production-specific utility to handle image caching issues
 * This helps prevent stale cache issues that commonly occur in production
 */

let buildId: string | null = null

export const getProductionImageUrl = (url: string): string => {
  // Only apply in production
  if (process.env.NODE_ENV !== 'production') {
    return url
  }

  // Get build ID for cache busting (only once per session)
  if (!buildId && typeof window !== 'undefined') {
    buildId = Date.now().toString()
  }

  // Add cache buster for production
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}_cb=${buildId || 'static'}`
}

export const shouldForceImageReload = (): boolean => {
  // Force reload in production when navigating
  return process.env.NODE_ENV === 'production' && typeof window !== 'undefined'
}
