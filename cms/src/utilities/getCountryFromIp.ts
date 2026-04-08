/**
 * Resolves the visitor's 2-letter country code from their IP address.
 *
 * Priority order for IP extraction:
 *   1. x-vercel-ip-country  (Vercel – fastest, no extra fetch)
 *   2. cf-ipcountry          (Cloudflare)
 *   3. x-forwarded-for       (ngrok, proxies – first public IP)
 *   4. x-real-ip
 *
 * Falls back to 'GH' when running locally or on error.
 */
export async function getCountryFromIp(headersList: Headers): Promise<string> {
  // Fast path: Vercel or Cloudflare already resolved it
  const vercelCountry = headersList.get('x-vercel-ip-country')
  if (vercelCountry) return vercelCountry.toUpperCase()

  const cfCountry = headersList.get('cf-ipcountry')
  if (cfCountry && cfCountry !== 'XX') return cfCountry.toUpperCase()

  // Extract the first public IP from x-forwarded-for or x-real-ip
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')

  const rawIp = forwarded ? forwarded.split(',')[0].trim() : realIp?.trim()

  if (!rawIp || rawIp === '127.0.0.1' || rawIp === '::1') {
    return 'GH' // local dev fallback
  }

  try {
    const res = await fetch(`https://ipapi.co/${rawIp}/country_code/`, {
      next: { revalidate: 3600 }, // cache per-IP for 1 hour
      headers: { 'User-Agent': 'hogapay/1.0' },
    })
    if (res.ok) {
      const code = (await res.text()).trim().toUpperCase()
      // ipapi.co returns 'THROTTLED' or error strings on failure
      if (/^[A-Z]{2}$/.test(code)) return code
    }
  } catch (_) {}

  return 'GH'
}
