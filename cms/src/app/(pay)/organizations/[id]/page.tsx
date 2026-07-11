import Link from 'next/link'
import { Metadata } from 'next'
import { ShieldCheck, ArrowRight } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  imageUrl: string | null
  goalAmount: number | null
  currency: string
  showGoal: boolean
  donationLabel: 'contribute' | 'donate'
  raised: number
  donors: number
  deadline: string | null
}

interface BusinessDetail {
  id: string
  businessName: string
  firstName: string | null
  lastName: string | null
  username: string | null
  country: string | null
  photoUrl: string | null
  campaignCount: number
  supporters: number
  campaigns: Campaign[]
}

const BADGE_COLORS = ['#B45309', '#15803D', '#1D4ED8', '#7C3AED', '#BE185D', '#0F766E']

function initials(name: string) {
  return (
    name
      .replace(/[^A-Za-z ]/g, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  )
}

function symbol(currency: string) {
  return currency === 'GHS' ? '₵' : currency === 'NGN' ? '₦' : ''
}

async function getBusiness(id: string): Promise<BusinessDetail | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/business-verifications/public/${id}`,
      { cache: 'no-store' },
    )
    const json = await res.json()
    return json?.success ? (json.data as BusinessDetail) : null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { id } = await params
  const b = await getBusiness(id)
  if (!b) return { title: 'Organization not found · Hoga' }
  return {
    title: `${b.businessName} · Campaigns on Hoga`,
    description: `Support ${b.businessName}'s campaigns. ${b.campaignCount} active on Hoga.`,
  }
}

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = await getBusiness(id)

  if (!b) {
    return (
      <div className="min-h-screen bg-primary-light grid place-items-center px-6 font-supreme">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Organization not found</h1>
          <p className="text-gray-600 mb-6">This organization may not be verified yet.</p>
          <Link href="/" className="text-green-700 font-semibold underline">
            Go to Hoga
          </Link>
        </div>
      </div>
    )
  }

  const color = BADGE_COLORS[0]
  const ownerName = `${b.firstName || ''} ${b.lastName || ''}`.trim()

  return (
    <div className="min-h-screen bg-primary-light text-black">
      <div className="container mx-auto px-4 md:px-8 py-6 md:py-8 font-supreme">
        {/* ---------- business header ---------- */}
        <div className="flex gap-5 items-start bg-white border border-[#E9E3D6] rounded-3xl p-6 flex-wrap">
          <div className="shrink-0">
            {b.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.photoUrl}
                alt={b.businessName}
                className="w-[78px] h-[78px] rounded-[20px] object-cover"
              />
            ) : (
              <div
                className="w-[78px] h-[78px] rounded-[20px] grid place-items-center text-white font-bold text-3xl"
                style={{ background: color }}
              >
                {initials(b.businessName)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-[220px]">
            <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2 flex-wrap">
              {b.businessName}
              <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified organization
              </span>
            </h1>
            <div className="text-sm text-gray-600 mt-1">
              {b.username ? `@${b.username}` : ownerName || 'Verified organizer'}
              {b.country ? ` · ${b.country}` : ''}
            </div>

            <div className="flex gap-7 mt-5 pt-5 border-t border-[#E9E3D6] w-full">
              <div>
                <div className="text-[22px] font-bold tabular-nums">{b.campaignCount}</div>
                <div className="text-xs uppercase tracking-wider text-gray-400">Campaigns</div>
              </div>
              <div>
                <div className="text-[22px] font-bold tabular-nums">
                  {b.supporters.toLocaleString()}
                </div>
                <div className="text-xs uppercase tracking-wider text-gray-400">Supporters</div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- campaigns ---------- */}
        <h2 className="text-xl font-bold tracking-tight mt-9 mb-1">Active campaigns</h2>
        <p className="text-sm text-gray-600 mb-5">
          {b.campaignCount} campaign{b.campaignCount === 1 ? '' : 's'} from {b.businessName} — pick
          one to contribute.
        </p>

        {b.campaigns.length === 0 ? (
          <p className="text-gray-500 py-12 text-center">No active campaigns right now.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 pb-16">
            {b.campaigns.map((c) => {
              const pct =
                c.goalAmount && c.goalAmount > 0
                  ? Math.min(Math.round((c.raised / c.goalAmount) * 100), 100)
                  : null
              const cur = symbol(c.currency)
              return (
                <Link
                  key={c.id}
                  href={`/pay/${c.id}/${encodeURIComponent(c.name || 'jar')}`}
                  className="group flex flex-col bg-white border border-[#E9E3D6] rounded-[20px] overflow-hidden shadow-[0_1px_2px_rgba(27,35,46,0.05)] transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_18px_36px_-22px_rgba(27,35,46,0.4)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full grid place-items-center"
                        style={{
                          background: `radial-gradient(120% 120% at 30% 20%, color-mix(in srgb, ${color} 42%, #1B232E), #1B232E)`,
                        }}
                      >
                        <span className="text-2xl font-bold text-white/90">
                          {initials(b.businessName)}
                        </span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 text-[11px] font-semibold uppercase tracking-wide text-white bg-black/60 backdrop-blur px-2.5 py-1 rounded-full">
                      Campaign
                    </span>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-base font-bold tracking-tight leading-snug">{c.name}</div>

                    {c.showGoal && pct !== null ? (
                      <>
                        <div className="h-[7px] rounded-full bg-[#EEF0E9] overflow-hidden mt-3 mb-2">
                          <div
                            className="h-full bg-green-700 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[13px] tabular-nums">
                          <span className="font-bold">
                            {cur}
                            {c.raised.toLocaleString()}
                          </span>
                          <span className="text-gray-500">
                            of {cur}
                            {(c.goalAmount as number).toLocaleString()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="mt-3 mb-1 text-[13px] text-gray-500 tabular-nums">
                        {c.donors} {c.donors === 1 ? 'supporter' : 'supporters'}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3.5 border-t border-[#E9E3D6]">
                      <span className="text-[12.5px] text-gray-400">
                        {c.donors} supporter{c.donors === 1 ? '' : 's'}
                        {c.showGoal && pct !== null ? ` · ${pct}%` : ''}
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-black text-white text-[13.5px] font-semibold px-4 py-2 rounded-full group-hover:bg-gray-900 transition-colors">
                        {c.donationLabel === 'donate' ? 'Donate' : 'Contribute'}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
