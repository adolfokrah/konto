'use client'

import { useState } from 'react'

interface ExpandableDescriptionProps {
  description: string
  className?: string
}

export default function ExpandableDescription({ 
  description, 
  className = "text-gray-700 mb-4 font-supreme" 
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
        className={`${className} whitespace-pre-line text-md ${
          !isExpanded && isLongDescription ? 'line-clamp-3' : ''
        }`}
        style={{lineHeight: 2}}
      >
        {description}
      </p>
      
      {isLongDescription && (
        <button
          onClick={toggleExpansion}
          className="text-md font-medium transition-colors duration-200 text-label cursor-pointer hover:underline"
        >
          {isExpanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  )
}
