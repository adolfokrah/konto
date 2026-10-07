export const typeStyles: Record<string, string> = {
  contribution: 'bg-[#F4FDDF] text-[#1B232E] border-[#DCEFB0]',
  payout: 'bg-[#EAF2FF] text-[#2E7CF6] border-transparent',
}

export const statusStyles: Record<string, string> = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  'awaiting-approval': 'bg-blue-100 text-blue-800 border-blue-200',
}

export const statusLabels: Record<string, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
  'awaiting-approval': 'Awaiting Approval',
}

export const paymentMethodLabels: Record<string, string> = {
  'mobile-money': 'Mobile Money',
  bank: 'Bank',
  cash: 'Cash',
  card: 'Card',
  'apple-pay': 'Apple Pay',
}

export const kycStatusStyles: Record<string, string> = {
  none: 'bg-red-100 text-red-800 border-red-200',
  in_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  verified: 'bg-green-100 text-green-800 border-green-200',
}

export const kycStatusLabels: Record<string, string> = {
  none: 'Not Verified',
  in_review: 'In Review',
  verified: 'Verified',
}

export const roleLabels: Record<string, string> = {
  user: 'User',
  admin: 'Admin',
}

export function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Network logos for mobile money providers (values seen in transactions.mobileMoneyProvider). */
const NETWORKS: Record<string, { label: string; logo: string }> = {
  mtn: { label: 'MoMo', logo: '/payment-logos/mtn.png' },
  telecel: { label: 'Telecel', logo: '/payment-logos/telecel.png' },
  vod: { label: 'Telecel', logo: '/payment-logos/telecel.png' },
  atl: { label: 'AirtelTigo', logo: '/payment-logos/airteltigo.png' },
  airteltigo: { label: 'AirtelTigo', logo: '/payment-logos/airteltigo.png' },
}

export function networkFor(provider: string | null | undefined) {
  return NETWORKS[(provider ?? '').toLowerCase()]
}
