import React from 'react'
import { cn } from '@/utilities/ui'

export interface AlertBlockProps {
  title?: string
  style?: 'info' | 'warning' | 'error' | 'success'
  className?: string
}

const alertStyles = {
  info: {
    container: 'bg-blue-50 border-l-blue-500',
    text: 'text-blue-900'
  },
  warning: {
    container: 'bg-[#FFF9E3] border-l-[#DBC46F]',
    text: 'text-black'
  },
  error: {
    container: 'bg-red-50 border-l-red-500',
    text: 'text-red-900'
  },
  success: {
    container: 'bg-green-50 border-l-green-500',
    text: 'text-green-900'
  }
}

export const AlertBlock: React.FC<AlertBlockProps> = ({
  title,
  style = 'warning',
  className
}) => {
  const styles = alertStyles[style]

  return (
    <div
      className={cn(
        'flex flex-row justify-center items-center p-3 md:p-6 gap-2.5 w-full border-l-6',
        styles.container,
        className
      )}
    >
      {title && (
        <div className={cn('flex-1 font-bold', styles.text)}>
          {title}
        </div>
      )}
    </div>
  )
}