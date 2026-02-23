export const typeStyles: Record<string, string> = {
  contribution: 'bg-purple-100 text-purple-800 border-purple-200',
  payout: 'bg-orange-100 text-orange-800 border-orange-200',
}

export const statusStyles: Record<string, string> = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
}

export const statusLabels: Record<string, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
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
