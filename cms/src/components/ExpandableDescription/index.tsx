'use client'

import { useState } from 'react'
import { cn } from '@/utilities/tw-merge'
import { Button } from '../ui/button'

interface ExpandableDescriptionProps {
  description: string
  className?: string
}

export default function ExpandableDescription({
  description,
  className = 'text-gray-700 mb-4 font-supreme',
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Check if the description is long enough to need expansion
  const isLongDescription = description.length > 200 || description.split('\n').length > 3

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div>
      <p
        className={cn(className, 'whitespace-pre-line text-md', {
          'line-clamp-3': !isExpanded && isLongDescription,
        })}
        style={{ lineHeight: 2 }}
      >
        {description}
      </p>

      {isLongDescription && (
        <Button
          variant={'link'}
          onClick={toggleExpansion}
          className="text-sm font-supreme px-0 font-medium transition-colors duration-200 text-label cursor-pointer hover:underline"
        >
          {isExpanded ? 'See less' : 'See more'}
        </Button>
      )}
    </div>
  )
}
