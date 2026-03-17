'use client'

import { Badge } from '@/components/ui/badge'
import { FaAndroid, FaApple } from 'react-icons/fa'

export function PlatformBadge({ platform }: { platform: 'android' | 'ios' | null | undefined }) {
  if (!platform) return null

  if (platform === 'android') {
    return (
      <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-700 gap-1.5">
        <FaAndroid size={12} />
        Android
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-700 gap-1.5">
      <FaApple size={12} />
      iOS
    </Badge>
  )
}
